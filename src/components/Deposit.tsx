import { StrategyInfo } from '@/store/strategies.atoms';
import { StrategyTxProps } from '@/store/transactions.atom';
import {
  DepositActionInputs,
  IStrategyActionHook,
  onStratAmountsChangeFn,
} from '@/strategies/IStrategy';
import { convertToMyNumber, convertToV1TokenInfo } from '@/utils';
import MyNumber from '@/utils/MyNumber';
import {
  Alert,
  AlertIcon,
  Box,
  Center,
  Flex,
  Progress,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useAccount } from '@starknet-react/core';
import { atom, PrimitiveAtom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import TxButton from './TxButton';
import { provider } from '@/constants';
import {
  SingleActionAmount,
  TokenInfo as TokenInfoV2,
  Web3Number,
} from '@strkfarm/sdk';
import AmountInput, { AmountInputRef } from './AmountInput';
import { addressAtom } from '@/store/claims.atoms';

interface DepositProps {
  strategy: StrategyInfo<any>;
  // ? If you want to add more button text, you can add here
  // ? @dev ensure below actionType is updated accordingly
  buttonText: 'Deposit' | 'Redeem';
  callsInfo: (inputs: DepositActionInputs) => Promise<IStrategyActionHook[]>;
  isDualToken: boolean;
}
/**
 * Information about a token amount input field
 */
export interface AmountInputInfo {
  /** Whether the max button was clicked */
  isMaxClicked: boolean;
  /** Raw string value entered in input field (e.g. '', '0.1') */
  rawAmount: string;
  /** Converted Web3Number value for calculations and transactions */
  amount: Web3Number;
  /** Token information, null if not yet selected */
  tokenInfo: TokenInfoV2 | null;
}

/**
 * State shape for deposit form
 */
export type DepositAtomType = {
  /** Array of atoms containing input info for each token */
  inputsInfo: PrimitiveAtom<AmountInputInfo>[];
  // deposit/withdrawMethods can return multiple options (which are actions)
  actionIndex: number;
  loading?: boolean;
  /** Optional callback when amounts change */
  onAmountsChange?: onStratAmountsChangeFn;
};

function getInputInfoAtoms() {
  return [1, 2].map((_) => {
    return atom<AmountInputInfo>({
      isMaxClicked: false,
      amount: Web3Number.fromWei('0', 0),
      tokenInfo: null,
      rawAmount: '',
    });
  });
}
/**
 * Derived atom of input infos
 */
export const inputsInfoAtoms = getInputInfoAtoms();

/**
 * Derived atom of input infos
 */
export const inputsInfoAtom = atom((get) => {
  return inputsInfoAtoms.map((i) => get(i));
});

// Create deposit atom with 2 token inputs (current max supported)
export const depositAtom = atom<DepositAtomType>({
  inputsInfo: inputsInfoAtoms,
  actionIndex: 0,
  loading: false,
  onAmountsChange: undefined,
});

/**
 * Derived atom that checks if max button was clicked for any input
 */
const isMaxClickedAtom = atom((get) => {
  const inputInfos = get(inputsInfoAtom);
  return inputInfos.some((a) => a.isMaxClicked);
});

export const updateInputInfoAtom = atom(
  null,
  (
    get,
    set,
    { index, info }: { index: number; info: Partial<AmountInputInfo> },
  ) => {
    const inputInfo = get(inputsInfoAtoms[index]);
    const newInputInfo = { ...inputInfo, ...info };
    console.log(`onAmountsChange [2]`, index, info, newInputInfo);
    set(inputsInfoAtoms[index], newInputInfo);
  },
);

export const resetDepositFormAtom = atom(null, (get, set) => {
  const inputInfos = get(inputsInfoAtom);
  set(depositAtom, {
    inputsInfo: getInputInfoAtoms(),
    actionIndex: 0,
    loading: false,
    onAmountsChange: undefined,
  });
  inputInfos.map((item, index) => {
    set(inputsInfoAtoms[index], {
      ...item,
      isMaxClicked: false,
      rawAmount: '',
      amount: Web3Number.fromWei('0', 0),
    });
  });
});

export default function Deposit(props: DepositProps) {
  return <InternalDeposit {...props} />;
}

function InternalDeposit(props: DepositProps) {
  const { address } = useAccount();
  const [callsInfo, setCallsInfo] = useState<IStrategyActionHook[]>([]);
  const [depositInfo, setDepositInfo] = useAtom(depositAtom);
  const firstInputInfo = useAtomValue(inputsInfoAtoms[0]);
  const isMaxClicked = useAtomValue(isMaxClickedAtom);
  const inputsInfo = useAtomValue(inputsInfoAtom);
  const resetDepositForm = useSetAtom(resetDepositFormAtom);

  useEffect(() => {
    resetDepositForm();
  }, []);

  const inputRef1 = useRef<AmountInputRef | null>(null);
  const inputRef2 = useRef<AmountInputRef | null>(null);

  const inputRefs = useMemo(() => {
    return [inputRef1, inputRef2];
  }, [inputRef1, inputRef2]);

  // since we use a separate jotai provider,
  // need to set this again here
  const setAddress = useSetAtom(addressAtom);
  useEffect(() => {
    setAddress(address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    const amount1 = new MyNumber(
      firstInputInfo.amount.toWei() || '0',
      firstInputInfo.tokenInfo?.decimals || 0,
    );
    let amount2: MyNumber | undefined = undefined;
    if (inputsInfo[1].tokenInfo) {
      amount2 = new MyNumber(
        inputsInfo[1].amount.toWei() || '0',
        inputsInfo[1].tokenInfo?.decimals || 0,
      );
    }
    console.log(
      'Deposit calls [0]',
      amount1.toString(),
      amount2?.toString(),
      address,
      firstInputInfo.tokenInfo?.decimals,
      inputsInfo[1].tokenInfo?.decimals,
    );
    props
      .callsInfo({
        amount: amount1,
        amount2,
        address: address || '0x0',
        provider,
        isMax: isMaxClicked,
      })
      .then((calls) => {
        console.log('Deposit calls', calls);
        setCallsInfo(calls);
        setDepositInfo({
          ...depositInfo,
          onAmountsChange: calls[0].onAmountsChange,
        });
      })
      .catch((e) => {
        console.error('Error in deposit methods', e);
      });
  }, [
    JSON.stringify(props.callsInfo),
    address,
    JSON.stringify(inputsInfo),
    JSON.stringify(firstInputInfo),
    isMaxClicked,
  ]);

  // This is used to store the raw amount entered by the user
  const isDeposit = useMemo(() => props.buttonText === 'Deposit', [props]);

  const [loadingInvestmentSummary, setLoadingInvestmentSummary] =
    useState(false);
  const [investedSummary, setInvestedSummary] = useState<Web3Number | null>(
    null,
  );

  useEffect(() => {
    if (!callsInfo.length) {
      setInvestedSummary(null);
      return;
    }
    if (callsInfo[0].amounts.length == 1) {
      setInvestedSummary(firstInputInfo.amount);
      setLoadingInvestmentSummary(false);
      return;
    }
    setLoadingInvestmentSummary(true);
    const amounts: SingleActionAmount[] = inputsInfo.map((a) => {
      return {
        amount: a.amount,
        tokenInfo: a.tokenInfo!,
      };
    });
    props.strategy
      .computeSummaryValue(
        amounts,
        props.strategy.settings.quoteToken,
        'depositcomp',
      )
      .then((summary) => {
        setInvestedSummary(summary);
        setLoadingInvestmentSummary(false);
      })
      .catch((e) => {
        console.error('Error in computeSummaryValue', e);
        setInvestedSummary(null);
        setLoadingInvestmentSummary(false);
      });
  }, [
    // arrays and complex objects tend to trigger re-renders too much
    // below is a workaround
    JSON.stringify(inputsInfo),
    props.strategy.settings.quoteToken,
    callsInfo.length,
    callsInfo.length ? callsInfo[0].amounts.length : 0,
    firstInputInfo.amount.toString(),
  ]);

  // use to maintain tx history and show toasts
  const txInfo: StrategyTxProps = useMemo(() => {
    return {
      strategyId: props.strategy.id,
      actionType: isDeposit ? 'deposit' : 'withdraw',
      amount: investedSummary
        ? convertToMyNumber(investedSummary)
        : MyNumber.fromZero(),
      tokenAddr: props.strategy.settings.quoteToken.address.address,
    };
  }, [props]);

  // constructs tx calls
  const { calls } = useMemo(() => {
    const hook = callsInfo[depositInfo.actionIndex];
    if (!hook) return { calls: [] };
    return { calls: hook.calls };
  }, [address, provider, isMaxClicked, callsInfo, depositInfo]);

  const tvlInfo = useAtomValue(props.strategy.tvlAtom);
  const isTVLFull = useMemo(() => {
    return (
      props.strategy.settings.maxTVL != 0 &&
      tvlInfo.data?.amounts[0].amount.greaterThan(
        props.strategy.settings.maxTVL.toFixed(6),
      )
    );
  }, [tvlInfo]);

  console.log('canSubmit [2]', investedSummary, loadingInvestmentSummary);
  const canSubmit = useMemo(() => {
    console.log('canSubmit [1]', isTVLFull, isDeposit, depositInfo.loading);
    if (isTVLFull && isDeposit) {
      return false;
    }
    if (depositInfo.loading) {
      return false;
    }

    // if (!investedSummary || loadingInvestmentSummary) {
    //   return false;
    // }
    // todo consider max cap of each token as well
    return inputsInfo.some((a) => a.amount.greaterThan(0));
  }, [
    depositInfo,
    loadingInvestmentSummary,
    investedSummary,
    inputsInfo,
    isTVLFull,
    isDeposit,
  ]);

  return (
    <Box>
      <VStack width={'100%'} gap={5}>
        {/* // todo wont work with multiple token options for now */}
        {callsInfo.length &&
          callsInfo[0].amounts.map((inputAmtInfo, index) => {
            return (
              <AmountInput
                ref={inputRefs[index]}
                key={index}
                index={index}
                tokenInfo={inputAmtInfo.tokenInfo}
                balanceAtom={inputAmtInfo.balanceAtom}
                isDeposit={isDeposit}
                strategy={props.strategy}
                buttonText={props.buttonText}
                // return the tokens from the array of actions, but at same index
                supportedTokens={callsInfo.map(
                  (c) => c.amounts[index].tokenInfo,
                )}
              />
            );
          })}
      </VStack>

      <Center marginTop={'20px'}>
        <TxButton
          txInfo={txInfo}
          buttonText={props.buttonText}
          text={
            depositInfo.loading || loadingInvestmentSummary
              ? 'Loading...'
              : props.buttonText
          }
          calls={calls}
          buttonProps={{
            isDisabled: !canSubmit,
          }}
          selectedMarket={convertToV1TokenInfo(
            props.strategy.settings.quoteToken,
          )}
          strategy={props.strategy}
          resetDepositForm={() => {
            resetDepositForm();
            inputRefs.forEach((ref) => {
              if (ref.current) {
                ref.current.reset();
              }
            });
          }}
        />
      </Center>

      {/* <Flex
        justifyContent={'space-between'}
        marginTop={'30px'}
        borderRadius={'lg'}
        padding={'8px'}
      >
        <Text fontSize={'14px'} fontWeight={'400'} color="text_secondary">
          Fees:
        </Text>
        <Text fontSize={'14px'} color="text_secondary">
          No additional fees by Troves
        </Text>
      </Flex> */}

      {!props.strategy.isRetired() && props.strategy.settings.maxTVL !== 0 && (
        <Flex
          flexDirection={'column'}
          width="100%"
          marginTop={'15px'}
          gap={'6px'}
          fontSize={'12px'}
        >
          <Flex width={'100%'} justifyContent={'space-between'}>
            <Text color={'text_secondary'}>TVL Limt:</Text>
            <Flex justifyContent={'flex-end'} gap={1}>
              <Text color="text_secondary" fontWeight={'500'}>
                {!tvlInfo || !tvlInfo?.data ? (
                  <Spinner size="2xs" />
                ) : (
                  Number(
                    tvlInfo.data?.amounts[0].amount.toFixed(2),
                  ).toLocaleString()
                )}
              </Text>
              <Text color={'text_secondary'} fontWeight={'500'}>
                {'/'}
              </Text>
              <Text color={'text_secondary'} fontWeight={'500'}>
                {props.strategy.settings.maxTVL.toLocaleString()}{' '}
                {inputsInfo[0].tokenInfo?.symbol}
              </Text>
            </Flex>
          </Flex>
          <Progress
            colorScheme="teal"
            bg="bg_4"
            borderRadius={'6px'}
            value={
              (100 *
                (Number(tvlInfo.data?.amounts[0].amount.toFixed(2)) ||
                  props.strategy.settings.maxTVL)) /
              props.strategy.settings.maxTVL
            }
            isIndeterminate={!tvlInfo || !tvlInfo?.data}
          />
          {isTVLFull && isDeposit && (
            <Alert
              status="warning"
              bg="mycard"
              marginTop={'20px'}
              borderRadius={'10px'}
            >
              <AlertIcon />
              <Text fontSize={'12px'} color={'text_secondary'}>
                TVL limit reached. Please wait for increase in limits.
              </Text>
            </Alert>
          )}
          {/* {tvlInfo.isError ? 1 : 0}{tvlInfo.isLoading ? 1 : 0} {JSON.stringify(tvlInfo.error)} */}
        </Flex>
      )}
    </Box>
  );
}
