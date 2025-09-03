import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Box,
  Text,
  GridItem,
  NumberInput,
  NumberInputField,
  Image as ImageC,
  Button,
  Tooltip,
  Grid,
  Menu,
  MenuButton,
  Center,
  MenuList,
  MenuItem,
  Link,
  HStack,
  Flex,
} from '@chakra-ui/react';
import { useAccount } from '@starknet-react/core';
import { useAtom, useAtomValue, Atom, useSetAtom } from 'jotai';
import { TokenInfo as TokenInfoV2, Web3Number } from '@strkfarm/sdk';
import {
  AmountInputInfo,
  depositAtom,
  DepositAtomType,
  inputsInfoAtom,
  updateInputInfoAtom,
} from './Deposit';
import mixpanel from 'mixpanel-browser';
import { AtomWithQueryResult } from 'jotai-tanstack-query';
import { BalanceResult, DUMMY_BAL_ATOM } from '@/store/balance.atoms';
import { StrategyInfo } from '@/store/strategies.atoms';
import MyNumber from '@/utils/MyNumber';
import LoadingWrap from './LoadingWrap';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { MyMenuItemProps, MyMenuListProps } from '@/utils';
import debounce from 'lodash.debounce';
import { MYSTYLES } from '@/style';

interface AmountInputProps {
  index: number;
  tokenInfo: TokenInfoV2;
  balanceAtom?: Atom<AtomWithQueryResult<BalanceResult, Error>>;
  strategy: StrategyInfo<any>;
  isDeposit: boolean;
  buttonText: string;
  supportedTokens: TokenInfoV2[];
}

export interface AmountInputRef {
  reset: () => void;
}

/**
 * AmountInput component handles token amount input with balance and TVL validation
 * @param props Component properties including token info, strategy details, and mode
 * @param ref Ref to expose reset functionality to parent
 */
const AmountInput = forwardRef(
  (props: AmountInputProps, ref: React.ForwardedRef<AmountInputRef>) => {
    // Input state
    const [dirty, setDirty] = useState(false);

    // External state
    const tvlInfo = useAtomValue(props.strategy.tvlAtom);
    const { address } = useAccount();
    const [depositInfo, setDepositInfo] = useAtom(depositAtom);
    const setInputInfo = useSetAtom(updateInputInfoAtom);
    const inputsInfo = useAtomValue(inputsInfoAtom);
    const [simulatedMaxAmount, setSimulatedMaxAmount] = useState({
      isSet: false,
      amount: 1e18,
    }); // some random big amount to start with

    const inputInfo = useMemo(() => {
      if (props.index < 0 || props.index >= inputsInfo.length)
        throw new Error(`Invalid index: ${props.index}`);
      return inputsInfo[props.index];
    }, [inputsInfo, props.index]);

    // Default token state
    const [selectedMarket, setSelectedMarket] = useState<TokenInfoV2>(
      props.tokenInfo,
    );

    useImperativeHandle(ref, () => ({
      reset: () => {
        setDirty(false);
        updateTokenInfo({
          amount: Web3Number.fromWei('0', props.tokenInfo.decimals),
          tokenInfo: props.tokenInfo,
          isMaxClicked: false,
          rawAmount: '',
        });
      },
    }));

    // Get balance data
    const balData = useAtomValue(props.balanceAtom || DUMMY_BAL_ATOM);
    const balance = useMemo(() => {
      return balData.data?.amount || MyNumber.fromZero();
    }, [balData]);

    const isMinAmountError: boolean = useMemo(() => {
      if (!dirty) return false;

      const isAtleastOneNonZero = inputsInfo.some((item) => item.amount.gt(0));
      if (isAtleastOneNonZero) {
        return false;
      }
      return true;
    }, [inputsInfo]);
    /**
     * Calculate maximum allowed amount based on:
     * - TVL limits for deposits
     * - Balance minus gas reserves for specific tokens
     * - Zero as minimum
     */
    const maxAmount: MyNumber = useMemo(() => {
      const currentTVL = Number(
        tvlInfo.data?.amounts[0].amount.toFixed(6) || 0,
      );
      const maxAllowed =
        props.isDeposit && props.strategy.settings.maxTVL !== 0
          ? props.strategy.settings.maxTVL - currentTVL
          : Number(balance.toEtherToFixedDecimals(8));

      const adjustedMaxAllowed = MyNumber.fromEther(
        maxAllowed.toFixed(6),
        selectedMarket.decimals,
      );

      // Reserve gas amounts for specific tokens
      let reducedBalance = balance;
      if (props.isDeposit) {
        if (selectedMarket.name === 'STRK') {
          reducedBalance = balance.subtract(
            MyNumber.fromEther('1.5', selectedMarket.decimals),
          );
        } else if (selectedMarket.name === 'ETH') {
          reducedBalance = balance.subtract(
            MyNumber.fromEther('0.001', selectedMarket.decimals),
          );
        }
      }

      // simulation check
      const postSimulationMax = MyNumber.min(
        adjustedMaxAllowed,
        MyNumber.fromEther(
          simulatedMaxAmount.amount.toFixed(13),
          selectedMarket.decimals,
        ),
      );

      const min = MyNumber.min(reducedBalance, postSimulationMax);
      return MyNumber.max(
        min,
        MyNumber.fromEther('0', selectedMarket.decimals),
      );
    }, [
      balance,
      props.strategy,
      selectedMarket,
      props.isDeposit,
      tvlInfo,
      simulatedMaxAmount.amount,
    ]);

    function onAmountChange(
      _amt: MyNumber,
      isMaxClicked: boolean,
      rawAmount = _amt.toEtherStr(),
      _token = props.tokenInfo,
    ) {
      updateTokenInfo({
        tokenInfo: _token,
        amount: Web3Number.fromWei(_amt.toString(), _token.decimals),
        isMaxClicked,
        rawAmount,
      });

      checkAndTriggerOnAmountsChange(_amt, _token, inputsInfo, depositInfo);
    }

    function checkAndTriggerOnAmountsChange(
      _amt: MyNumber,
      _token: TokenInfoV2 = props.tokenInfo,
      _inputsInfo: AmountInputInfo[],
      _depositInfo: DepositAtomType,
    ) {
      // if onAmountsChange defined
      const isAllTokenInfosDefined = _inputsInfo.every(
        (item) => item.tokenInfo,
      );
      console.log(
        'onAmountsChange [2.1]',
        props.index,
        isAllTokenInfosDefined,
        props.buttonText,
        _inputsInfo,
        _depositInfo.onAmountsChange,
      );
      if (!isAllTokenInfosDefined || !_depositInfo.onAmountsChange) {
        return;
      }
      const _amtWeb3 = Web3Number.fromWei(_amt.toString(), _token.decimals);
      console.log('onAmountsChange [2.2]', _amtWeb3.toString(), props.index);
      try {
        setDepositInfo({
          ..._depositInfo,
          loading: true,
        });
        _depositInfo
          .onAmountsChange(
            {
              amountInfo: {
                amount: _amtWeb3,
                tokenInfo: _token,
              },
              index: props.index,
            },
            _inputsInfo.map((item, index) => {
              if (index == props.index) {
                return {
                  amount: _amtWeb3,
                  tokenInfo: _token,
                };
              }
              return {
                amount: item.amount,
                tokenInfo: item.tokenInfo!,
              };
            }),
          )
          .then((output) => {
            console.log('onAmountsChange [2.3]', JSON.stringify(output));
            output.map((item, _index) => {
              console.log(
                'onAmountsChange [2.4]',
                item.amount.toString(),
                item.tokenInfo.symbol,
              );
              setInputInfo({
                index: _index,
                info: {
                  ..._inputsInfo[_index],
                  ...item,
                  rawAmount: Number(item.amount.toFixed(6)).toString(),
                },
              });
            });
            setDepositInfo({
              ..._depositInfo,
              loading: false,
            });
          })
          .catch((err) => {
            console.log('onAmountsChange [2.4]', err);
            setDepositInfo({
              ..._depositInfo,
              loading: false,
            });
          });
      } catch (err) {
        console.log('onAmountsChange [2.5] err', err);
      }
    }

    const handleMaxClick = useCallback(() => {
      onAmountChange(maxAmount, true);
      mixpanel.track('Chose max amount', {
        strategyId: props.strategy.id,
        strategyName: props.strategy.name,
        buttonText: props.buttonText,
        amount: inputInfo.amount.toFixed(2),
        token: selectedMarket.name,
        maxAmount: maxAmount.toEtherStr(),
        address,
      });
    }, [
      onAmountChange,
      maxAmount,
      inputInfo,
      selectedMarket,
      props.strategy,
      props.buttonText,
      address,
    ]);

    function BalanceComponent(props: {
      token: TokenInfoV2;
      strategy: StrategyInfo<any>;
      buttonText: string;
    }) {
      const isLoading = balData.isLoading || balData.isPending;

      return (
        <Box textAlign={'right'}>
          <Text color={'text_secondary'}>Wallet balance </Text>
          <LoadingWrap
            isLoading={isLoading}
            isError={balData.isError}
            skeletonProps={{
              height: '10px',
              width: '50px',
              float: 'right',
              marginTop: '8px',
              marginLeft: '5px',
            }}
            iconProps={{
              marginLeft: '5px',
              boxSize: '15px',
            }}
          >
            {props.strategy.settings.isInMaintenance ? (
              <Text color={'text_secondary'}>-</Text>
            ) : (
              <Flex width={'100%'} align={'flex-end'} justify={'flex-end'}>
                <Tooltip
                  label={`Exact balance: ${balance.toEtherStr()}`}
                  {...MYSTYLES.TOOLTIP.STANDARD}
                >
                  <Text
                    style={{ marginLeft: '5px' }}
                    color="text_primary"
                    fontWeight={'600'}
                  >
                    {balance.toEtherToFixedDecimals(4)}
                  </Text>
                </Tooltip>
                <Button
                  size={'sm'}
                  marginLeft={'5px'}
                  color="text_secondary"
                  padding="0"
                  bg="transparent"
                  maxHeight={'25px'}
                  _hover={{
                    color: 'text_primary',
                  }}
                  _active={{
                    color: 'text_primary',
                  }}
                  onClick={handleMaxClick}
                  isDisabled={isLoading || balData.isError}
                  aria-label="Set maximum amount"
                >
                  [Max]
                </Button>
              </Flex>
            )}
          </LoadingWrap>
        </Box>
      );
    }

    useEffect(() => {
      console.log(`onAmountsChange [10.2]`, inputInfo, props.index);
    }, [JSON.stringify(inputsInfo)]);

    function updateTokenInfo(inputInfo: AmountInputInfo) {
      const { amount, tokenInfo: _t, isMaxClicked, rawAmount } = inputInfo;
      console.log(
        `onAmountsChange [10.1]`,
        amount.toWei(),
        inputInfo,
        props.index,
        props.buttonText,
      );
      const tokenInfo = _t!;
      const _amount = Web3Number.fromWei(amount.toWei(), tokenInfo.decimals);
      setInputInfo({
        index: props.index,
        info: {
          amount: _amount,
          tokenInfo,
          isMaxClicked,
          rawAmount,
        },
      });
    }

    useEffect(() => {
      console.log('onAmountsChange [3]', props);
      updateTokenInfo({
        amount: Web3Number.fromWei('0', props.tokenInfo.decimals),
        tokenInfo: props.tokenInfo,
        isMaxClicked: false,
        rawAmount: '',
      });
    }, []);

    useEffect(() => {
      if (
        !depositInfo ||
        !depositInfo.onAmountsChange ||
        simulatedMaxAmount.isSet
      ) {
        return;
      }
      // simulate deposits using a large amount
      const amt = new Web3Number(10000000, props.tokenInfo.decimals);
      depositInfo
        .onAmountsChange(
          {
            amountInfo: {
              amount: amt,
              tokenInfo: props.tokenInfo,
            },
            index: props.index,
          },
          inputsInfo.map((item, index) => {
            if (index == props.index) {
              return {
                amount: amt,
                tokenInfo: props.tokenInfo,
              };
            }
            return {
              amount: Web3Number.fromWei('0', item.tokenInfo?.decimals || 0),
              tokenInfo: item.tokenInfo!,
            };
          }),
        )
        .then((output) => {
          console.log('onAmountsChange [3.1]', output);
          output.map((item, _index) => {
            if (_index == props.index) {
              setSimulatedMaxAmount({
                isSet: true,
                amount: Number(item.amount.toFixed(13)),
              });
            }
          });
        });
    }, [depositInfo.onAmountsChange, simulatedMaxAmount.isSet]);

    const handleDebouncedChange = useCallback(
      debounce(
        (
          newAmount: MyNumber,
          valueStr: string,
          _inputsInfo: AmountInputInfo[],
          _depositInfo: DepositAtomType,
        ) => {
          checkAndTriggerOnAmountsChange(
            newAmount,
            props.tokenInfo,
            _inputsInfo,
            _depositInfo,
          );

          // Track user input
          mixpanel.track('Enter amount', {
            strategyId: props.strategy.id,
            strategyName: props.strategy.name,
            buttonText: props.buttonText,
            amount: inputInfo.amount.toFixed(2),
            token: selectedMarket.name,
            maxAmount: maxAmount.toEtherStr(),
            address,
          });
        },
        400,
      ),
      [],
    ); // ms delay

    return (
      <Box width={'100%'}>
        {/* Token selection and balance display */}
        <Grid templateColumns="repeat(5, 1fr)" gap={6}>
          <GridItem colSpan={2}>
            <Menu>
              <MenuButton
                as={Button}
                height={'100%'}
                rightIcon={<ChevronDownIcon width={'20px'} height={'20px'} />}
                maxWidth={'200px'}
                minWidth={'140px'}
                width={'100%'}
                bg={'input_light'}
                color="text_primary"
                fontSize={'16px'}
                fontWeight={'500'}
                padding={'10px 16px'}
                textAlign={'left'}
                _hover={{
                  bg: 'mycard_light_2x',
                }}
                _active={{
                  bg: 'mycard_light_2x',
                }}
              >
                <HStack>
                  <ImageC
                    src={props.tokenInfo.logo}
                    alt={props.tokenInfo.symbol}
                    width={'20px'}
                    marginRight="5px"
                  />
                  <Text>{props.tokenInfo.symbol}</Text>
                </HStack>
              </MenuButton>
              <MenuList {...MyMenuListProps}>
                {props.supportedTokens.map((token) => (
                  <MenuItem
                    key={token.symbol}
                    {...MyMenuItemProps}
                    onClick={() => {
                      if (selectedMarket.name !== token.symbol) {
                        setSelectedMarket(token);
                        setDirty(false);
                        onAmountChange(
                          new MyNumber('0', token.decimals),
                          inputInfo.isMaxClicked,
                          '',
                          token,
                        );
                      }
                    }}
                  >
                    <Center>
                      <ImageC
                        src={token.logo}
                        alt={token.symbol}
                        width={'20px'}
                        marginRight="5px"
                      />
                      {token.symbol}
                    </Center>
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </GridItem>
          <GridItem colSpan={3}>
            <BalanceComponent
              token={selectedMarket}
              strategy={props.strategy}
              buttonText={props.buttonText}
            />
          </GridItem>
        </Grid>

        {/* Amount input with validation */}
        <NumberInput
          min={0}
          max={parseFloat(maxAmount.toEtherStr())}
          color={'white'}
          bg={'input_light'}
          borderRadius={'lg'}
          onChange={(valueStr) => {
            const newAmount =
              valueStr && Number(valueStr) > 0
                ? MyNumber.fromEther(valueStr, selectedMarket.decimals)
                : new MyNumber('0', selectedMarket.decimals);

            setDirty(true);
            updateTokenInfo({
              tokenInfo: props.tokenInfo,
              amount: Web3Number.fromWei(
                newAmount.toString(),
                props.tokenInfo.decimals,
              ),
              isMaxClicked: inputInfo.isMaxClicked,
              rawAmount: valueStr,
            });
            handleDebouncedChange(newAmount, valueStr, inputsInfo, depositInfo);
          }}
          marginTop={'20px'}
          keepWithinRange={false}
          clampValueOnBlur={false}
          value={inputInfo.rawAmount}
          isDisabled={maxAmount.isZero()}
        >
          <NumberInputField
            border={'0px'}
            borderRadius={'lg'}
            placeholder="Amount"
            paddingRight="60px"
            color={'white'}
          />
          <Button
            size={'sm'}
            position="absolute"
            right="8px"
            top="50%"
            transform="translateY(-50%)"
            color="white"
            bg="transparent"
            padding="0 8px"
            height="24px"
            fontSize={'14px'}
            fontWeight={'500'}
            _hover={{
              bg: 'transparent',
              color: 'white',
            }}
            onClick={handleMaxClick}
          >
            MAX
          </Button>
        </NumberInput>

        {/* Validation error messages */}
        {simulatedMaxAmount.amount === 0 && (
          <Tooltip
            label={
              <Text color={'text_secondary'}>
                The liquidity at the current market price, is only in{' '}
                {
                  inputsInfo.find((_, index) => index !== props.index)
                    ?.tokenInfo?.symbol
                }
                . It may be in {props.tokenInfo.symbol}, when the market price
                re-aligns.
              </Text>
            }
            {...MYSTYLES.TOOLTIP.STANDARD}
          >
            <Text
              marginTop="2px"
              marginLeft={'7px'}
              fontSize={'12px'}
              color={'text_secondary'}
            >
              The liquidity at the current market price, is only in{' '}
              {
                inputsInfo.find((_, index) => index !== props.index)?.tokenInfo
                  ?.symbol
              }
              .{' '}
              <Link
                href="https://docs.troves.fi/p/ekubo-cl-vaults"
                textDecoration={'underline'}
              >
                Learn more
              </Link>
              .
            </Text>
          </Tooltip>
        )}
        {isMinAmountError && dirty && (
          <Text
            marginTop="2px"
            marginLeft={'7px'}
            color="red"
            fontSize={'13px'}
          >
            Amount must be greater than 0
          </Text>
        )}
        {inputInfo.amount.gt(maxAmount.toEtherStr()) && (
          <Text
            marginTop="2px"
            marginLeft={'7px'}
            color="red"
            fontSize={'13px'}
          >
            Amount must be less than {maxAmount.toEtherToFixedDecimals(2)}
          </Text>
        )}
      </Box>
    );
  },
);

AmountInput.displayName = 'AmountInput';
export default AmountInput;
