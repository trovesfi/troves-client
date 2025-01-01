'use client';

import {
  Alert,
  AlertIcon,
  Avatar,
  Box,
  Card,
  Center,
  Flex,
  Grid,
  GridItem,
  Link,
  ListItem,
  OrderedList,
  Spinner,
  Tab,
  TabIndicator,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useAccount } from '@starknet-react/core';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import mixpanel from 'mixpanel-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Deposit from '@/components/Deposit';
import { DUMMY_BAL_ATOM } from '@/store/balance.atoms';
import { StrategyInfo, strategiesAtom } from '@/store/strategies.atoms';
import { transactionsAtom, TxHistoryAtom } from '@/store/transactions.atom';
import HarvestTime from '@/components/HarvestTime';
import {
  capitalize,
  getTokenInfoFromAddr,
  getUniqueById,
  shortAddress,
  timeAgo,
} from '@/utils';
import { StrategyParams } from '../page';
import MyNumber from '@/utils/MyNumber';
import { ExternalLinkIcon } from '@chakra-ui/icons';

const Strategy = ({ params }: StrategyParams) => {
  const { address } = useAccount();
  const strategies = useAtomValue(strategiesAtom);
  const transactions = useAtomValue(transactionsAtom);
  const [isMounted, setIsMounted] = useState(false);

  const strategy: StrategyInfo | undefined = useMemo(() => {
    const id = params.strategyId;

    console.log('id', id);

    return strategies.find((s) => s.id === id);
  }, [params.strategyId, strategies]);

  console.log('strategy', strategy);

  const strategyAddress = useMemo(() => {
    const holdingTokens = strategy?.holdingTokens;
    if (holdingTokens && holdingTokens.length) {
      const holdingTokenInfo: any = holdingTokens[0];
      return (holdingTokenInfo.address || holdingTokenInfo.token) as string;
    }
    return '';
  }, [strategy]);

  const setBalQueryEnable = useSetAtom(strategy?.balEnabled || atom(false));

  useEffect(() => {
    setBalQueryEnable(true);
  }, []);

  const balData = useAtomValue(strategy?.balanceAtom || DUMMY_BAL_ATOM);

  // fetch tx history
  const txHistoryAtom = useMemo(
    () =>
      TxHistoryAtom(
        strategyAddress,
        address!,
        strategy?.balanceAtom || DUMMY_BAL_ATOM,
      ),
    [address, strategyAddress, balData],
  );
  const txHistoryResult = useAtomValue(txHistoryAtom);
  const txHistory = useMemo(() => {
    if (txHistoryResult.data) {
      return {
        findManyInvestment_flows: [
          ...txHistoryResult.data.findManyInvestment_flows,
        ].sort((a, b) => {
          return b.timestamp - a.timestamp;
        }),
      };
    }
    console.log(
      'TxHistoryAtom',
      txHistoryResult.error,
      txHistoryResult.isError,
      txHistoryResult.isLoading,
    );
    return txHistoryResult.data || { findManyInvestment_flows: [] };
  }, [txHistoryResult.data]);

  // compute profit
  // profit doesnt change quickly in real time, but total deposit amount can change
  // and it can impact the profit calc as txHistory may not be updated at the same time as balData
  // So, we compute profit once only
  const [profit, setProfit] = useState(0);
  const computeProfit = useCallback(() => {
    if (!txHistory.findManyInvestment_flows.length) return 0;
    const tokenInfo = getTokenInfoFromAddr(
      txHistory.findManyInvestment_flows[0].asset,
    );
    if (!tokenInfo) return 0;
    const netDeposits = txHistory.findManyInvestment_flows.reduce((acc, tx) => {
      const sign = tx.type === 'deposit' ? 1 : -1;
      return (
        acc +
        sign *
          Number(
            new MyNumber(tx.amount, tokenInfo.decimals).toEtherToFixedDecimals(
              4,
            ),
          )
      );
    }, 0);
    const currentValue = Number(
      balData.data?.amount.toEtherToFixedDecimals(4) || '0',
    );
    if (currentValue === 0) return 0;

    if (netDeposits === 0) return 0;
    setProfit(currentValue - netDeposits);
  }, [txHistory, balData]);

  useEffect(() => {
    if (profit == 0) {
      computeProfit();
    }
  }, [txHistory, balData]);

  useEffect(() => {
    mixpanel.track('Strategy page open', { name: params.strategyId });
  }, [params.strategyId]);

  const colSpan1: any = { base: '5', md: '3' };
  const colSpan2: any = { base: '5', md: '2' };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <Flex marginBottom={'10px'}>
        <Avatar marginRight={'5px'} src={strategy?.holdingTokens[0].logo} />
        <Text
          marginTop={'6px'}
          fontSize={{ base: '18px', md: '25px' }}
          fontWeight={'bold'}
          color="white"
        >
          {strategy ? strategy.name : 'Strategy Not found'}
        </Text>
      </Flex>

      {strategy && (
        <VStack width={'100%'}>
          <Grid width={'100%'} templateColumns="repeat(5, 1fr)" gap={2}>
            <GridItem display="flex" colSpan={colSpan1}>
              <Card width="100%" padding={'15px'} color="white" bg="highlight">
                <HarvestTime strategy={strategy} balData={balData} />
                <Box display={{ base: 'block', md: 'flex' }} marginTop={'10px'}>
                  <Box width={{ base: '100%', md: '100%' }}>
                    <Text
                      fontSize={'20px'}
                      marginBottom={'0px'}
                      fontWeight={'bold'}
                    >
                      How does it work?
                    </Text>
                    <Text
                      color="light_grey"
                      marginBottom="5px"
                      fontSize={'15px'}
                    >
                      {strategy.description}
                    </Text>
                    <Wrap>
                      {getUniqueById(
                        strategy.actions.map((p) => ({
                          id: p.pool.protocol.name,
                          logo: p.pool.protocol.logo,
                        })),
                      ).map((p) => (
                        <WrapItem marginRight={'10px'} key={p.id}>
                          <Center>
                            <Avatar
                              size="2xs"
                              bg={'black'}
                              src={p.logo}
                              marginRight={'2px'}
                            />
                            <Text marginTop={'2px'}>{p.id}</Text>
                          </Center>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                </Box>
                <Box
                  padding={'10px'}
                  borderRadius={'10px'}
                  bg={'bg'}
                  marginTop={'20px'}
                >
                  {!balData.isLoading &&
                    !balData.isError &&
                    !balData.isPending &&
                    balData.data &&
                    balData.data.tokenInfo && (
                      <Flex width={'100%'} justifyContent={'space-between'}>
                        <Box>
                          <Text>
                            <b>Your Holdings </b>
                          </Text>
                          <Text color="cyan">
                            {address
                              ? Number(
                                  balData.data.amount.toEtherToFixedDecimals(
                                    balData.data.tokenInfo?.displayDecimals ||
                                      2,
                                  ),
                                ) == 0
                                ? '-'
                                : `${balData.data.amount.toEtherToFixedDecimals(balData.data.tokenInfo?.displayDecimals || 2)} ${balData.data.tokenInfo?.name}`
                              : 'Connect wallet'}
                          </Text>
                        </Box>
                        <Tooltip label="Life time earnings">
                          <Box>
                            <Text textAlign={'right'} fontWeight={'none'}>
                              <b>Net earnings</b>
                            </Text>
                            <Text
                              textAlign={'right'}
                              color={profit >= 0 ? 'cyan' : 'red'}
                            >
                              {address && profit != 0
                                ? `${profit?.toFixed(balData.data.tokenInfo?.displayDecimals || 2)} ${balData.data.tokenInfo?.name}`
                                : '-'}
                            </Text>
                          </Box>
                        </Tooltip>
                      </Flex>
                    )}
                  {(balData.isLoading ||
                    balData.isPending ||
                    !balData.data?.tokenInfo) && (
                    <Text>
                      <b>Your Holdings: </b>
                      {address ? (
                        <Spinner size="sm" marginTop={'5px'} />
                      ) : (
                        'Connect wallet'
                      )}
                    </Text>
                  )}
                  {balData.isError && (
                    <Text>
                      <b>Your Holdings: Error</b>
                    </Text>
                  )}
                </Box>
              </Card>
            </GridItem>

            <GridItem display="flex" colSpan={colSpan2}>
              <Card width="100%" padding={'15px'} color="white" bg="highlight">
                <Tabs position="relative" variant="unstyled" width={'100%'}>
                  <TabList>
                    <Tab
                      color="light_grey"
                      _selected={{ color: 'purple' }}
                      onClick={() => {
                        // mixpanel.track('All pools clicked')
                      }}
                    >
                      Deposit
                    </Tab>
                    <Tab
                      color="light_grey"
                      _selected={{ color: 'purple' }}
                      onClick={() => {
                        // mixpanel.track('Strategies opened')
                      }}
                    >
                      Withdraw
                    </Tab>
                  </TabList>
                  <TabIndicator
                    mt="-1.5px"
                    height="2px"
                    bg="purple"
                    color="color1"
                    borderRadius="1px"
                  />
                  <TabPanels>
                    <TabPanel
                      bg="highlight"
                      float={'left'}
                      width={'100%'}
                      padding={'10px 0'}
                    >
                      <Deposit
                        strategy={strategy}
                        buttonText="Deposit"
                        callsInfo={strategy.depositMethods}
                      />
                      {strategy.settings.alerts != undefined && (
                        <VStack mt={'20px'}>
                          {strategy.settings.alerts
                            .filter((a) => a.tab == 'deposit')
                            .map((alert, index) => (
                              <Alert
                                status={alert.type}
                                fontSize={'12px'}
                                color={'light_grey'}
                                borderRadius={'10px'}
                                bg="color2_50p"
                                padding={'10px'}
                                key={index}
                              >
                                <AlertIcon />
                                {alert.text}
                              </Alert>
                            ))}
                        </VStack>
                      )}
                    </TabPanel>
                    <TabPanel
                      bg="highlight"
                      width={'100%'}
                      float={'left'}
                      padding={'10px 0'}
                    >
                      <Deposit
                        strategy={strategy}
                        buttonText="Redeem"
                        callsInfo={strategy.withdrawMethods}
                      />
                      {strategy.settings.alerts != undefined && (
                        <VStack mt={'20px'}>
                          {strategy.settings.alerts
                            .filter((a) => a.tab == 'withdraw')
                            .map((alert, index) => (
                              <Alert
                                status={alert.type}
                                fontSize={'12px'}
                                color={'light_grey'}
                                borderRadius={'10px'}
                                bg="color2_50p"
                                padding={'10px'}
                                key={index}
                              >
                                <AlertIcon />
                                {alert.text}
                              </Alert>
                            ))}
                        </VStack>
                      )}
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Card>
            </GridItem>
          </Grid>

          <Card width={'100%'} color="white" bg="highlight" padding={'15px'}>
            <Text fontSize={'20px'} marginBottom={'0px'} fontWeight={'bold'}>
              Behind the scenes
            </Text>
            <Text fontSize={'15px'} marginBottom={'10px'}>
              Actions done automatically by the strategy (smart-contract) with
              an investment of $1000
            </Text>
            <Flex
              color="white"
              width={'100%'}
              className="text-cell"
              display={{ base: 'none', md: 'flex' }}
            >
              <Text width={'50%'} padding={'5px 10px'}>
                Action
              </Text>
              <Text width={'30%'} textAlign={'left'} padding={'5px 10px'}>
                Protocol
              </Text>
              <Text width={'10%'} textAlign={'right'} padding={'5px 10px'}>
                Amount
              </Text>
              <Text width={'10%'} textAlign={'right'} padding={'5px 10px'}>
                Yield
              </Text>
            </Flex>
            {strategy.actions.map((action, index) => (
              <Box
                className="text-cell"
                display={{ base: 'block', md: 'flex' }}
                key={index}
                width={'100%'}
                color="light_grey"
                fontSize={'14px'}
              >
                <Text width={{ base: '100%', md: '50%' }} padding={'5px 10px'}>
                  {index + 1}
                  {')'} {action.name}
                </Text>
                <Text width={{ base: '100%', md: '30%' }} padding={'5px 10px'}>
                  <Avatar
                    size="2xs"
                    bg={'black'}
                    src={action.pool.pool.logos[0]}
                    marginRight={'2px'}
                  />{' '}
                  {action.pool.pool.name} on
                  <Avatar
                    size="2xs"
                    bg={'black'}
                    src={action.pool.protocol.logo}
                    marginRight={'2px'}
                    marginLeft={'5px'}
                  />{' '}
                  {action.pool.protocol.name}
                </Text>
                <Text
                  display={{ base: 'block', md: 'none' }}
                  width={{ base: '100%', md: '10%' }}
                  padding={'5px 10px'}
                >
                  ${Number(action.amount).toLocaleString()} yields{' '}
                  {action.isDeposit
                    ? (action.pool.apr * 100).toFixed(2)
                    : -(action.pool.borrow.apr * 100).toFixed(2)}
                  %
                </Text>
                <Text
                  display={{ base: 'none', md: 'block' }}
                  width={{ base: '100%', md: '10%' }}
                  textAlign={'right'}
                  padding={'5px 10px'}
                >
                  ${Number(action.amount).toLocaleString()}
                </Text>
                <Text
                  display={{ base: 'none', md: 'block' }}
                  width={{ base: '100%', md: '10%' }}
                  textAlign={'right'}
                  padding={'5px 10px'}
                >
                  {action.isDeposit
                    ? (action.pool.apr * 100).toFixed(2)
                    : -(action.pool.borrow.apr * 100).toFixed(2)}
                  %
                </Text>
              </Box>
            ))}
            {strategy.actions.length == 0 && (
              <Center width={'100%'} padding={'10px'}>
                <Spinner size={'xs'} color="white" />
              </Center>
            )}
          </Card>
          <Grid width={'100%'} templateColumns="repeat(5, 1fr)" gap={2}>
            <GridItem colSpan={colSpan1} bg="highlight">
              {/* Risks card */}
              <Card
                width={'100%'}
                color="white"
                bg="highlight"
                padding={'15px'}
              >
                <Text
                  fontSize={'20px'}
                  marginBottom={'10px'}
                  fontWeight={'bold'}
                >
                  Risks
                </Text>
                <OrderedList>
                  {strategy.risks.map((r) => (
                    <ListItem
                      color="light_grey"
                      key={r}
                      fontSize={'14px'}
                      marginBottom={'5px'}
                      alignItems={'justify'}
                    >
                      {r}
                    </ListItem>
                  ))}
                </OrderedList>
              </Card>
            </GridItem>
            <GridItem colSpan={colSpan2} bg={'highlight'}>
              {/* Transaction history card */}
              <Card
                width={'100%'}
                color="white"
                bg="highlight"
                padding={'15px'}
              >
                <Text fontSize={'20px'} fontWeight={'bold'}>
                  Transaction history
                </Text>
                <Text fontSize={'13px'} marginBottom={'10px'} color={'color2'}>
                  There may be delays fetching data. If your transaction{' '}
                  {`isn't`} found, try again later.
                </Text>

                {txHistoryResult.isSuccess && (
                  <>
                    {txHistory.findManyInvestment_flows.map((tx, index) => {
                      const token = getTokenInfoFromAddr(tx.asset);
                      const decimals = token?.decimals;

                      return (
                        <Box
                          className="text-cell"
                          key={index}
                          width={'100%'}
                          color="light_grey"
                          fontSize={'14px'}
                          display={{ base: 'block', md: 'flex' }}
                        >
                          <Flex
                            width={{ base: '100%' }}
                            justifyContent={'space-between'}
                          >
                            <Text width={'10%'}>{index + 1}.</Text>
                            <Box width={'40%'}>
                              <Text
                                textAlign={'right'}
                                color={tx.type == 'deposit' ? 'cyan' : 'red'}
                                fontWeight={'bold'}
                              >
                                {Number(
                                  new MyNumber(
                                    tx.amount,
                                    decimals!,
                                  ).toEtherToFixedDecimals(
                                    token.displayDecimals,
                                  ),
                                ).toLocaleString()}{' '}
                                {token?.name}
                              </Text>
                              <Text textAlign={'right'} color="color2_65p">
                                {capitalize(tx.type)}
                              </Text>
                            </Box>

                            <Box width={'50%'} justifyContent={'flex-end'}>
                              <Text
                                width={'100%'}
                                textAlign={'right'}
                                fontWeight={'bold'}
                              >
                                <Link
                                  href={`https://starkscan.co/tx/${tx.txHash}`}
                                  target="_blank"
                                >
                                  {shortAddress(tx.txHash)} <ExternalLinkIcon />
                                </Link>
                              </Text>
                              <Text
                                width={'100%'}
                                textAlign={'right'}
                                color="color2_65p"
                              >
                                {/* The default msg contains strategy name, since this for a specific strategy, replace it */}
                                {timeAgo(new Date(tx.timestamp * 1000))}
                              </Text>
                            </Box>
                          </Flex>
                        </Box>
                      );
                    })}
                  </>
                )}

                {/* If no filtered tx */}
                {txHistory.findManyInvestment_flows.length === 0 && (
                  <Text
                    fontSize={'14px'}
                    textAlign={'center'}
                    color="light_grey"
                  >
                    No transactions found
                  </Text>
                )}
              </Card>
            </GridItem>
          </Grid>
        </VStack>
      )}
    </>
  );
};

export default Strategy;
