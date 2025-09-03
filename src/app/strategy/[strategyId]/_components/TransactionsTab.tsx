import {
  Box,
  Flex,
  Link,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
} from '@chakra-ui/react';
import { ArrowDownIcon, ArrowUpIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { useAccount } from '@starknet-react/core';

import {
  capitalize,
  getTokenInfoFromAddr,
  shortAddress,
  timeAgo,
} from '@/utils';
import MyNumber from '@/utils/MyNumber';
import { StrategyInfo } from '@/store/strategies.atoms';
import CONSTANTS from '@/constants';

interface ITransaction {
  amount: string;
  timestamp: number;
  type: string;
  txHash: string;
  asset: string;
  __typename: 'Investment_flows';
}
interface TransactionsTabProps {
  strategy: StrategyInfo<any>;
  // txHistoryResult: AtomWithQueryResult<TxHistory, Error>;
  txHistory: {
    findManyInvestment_flows: ITransaction[];
  };
  isMobile?: boolean;
}

function DesktopTransactionHistory(props: { transactions: ITransaction[] }) {
  const { transactions } = props;
  return (
    transactions.length !== 0 && (
      <>
        <TableContainer width={'100%'}>
          <Table
            variant="simple"
            sx={{
              overflow: 'hidden',
              'border-collapse': 'separate',
              'border-spacing': '0px 5px',
            }}
          >
            <Thead
              display={{ base: 'none', md: 'table-header-group' }}
              bg={'table_header_bg'}
            >
              <Tr>
                <Th
                  width={'50px'}
                  color={'white'}
                  fontSize={'14px'}
                  fontWeight={'600'}
                  textTransform={'capitalize'}
                  borderTopLeftRadius={'lg'}
                  borderBottomLeftRadius={'lg'}
                  borderRightWidth={'1px'}
                  borderColor={'mybg'}
                >
                  #
                </Th>
                <Th
                  color={'white'}
                  fontSize={'14px'}
                  fontWeight={'600'}
                  textTransform={'capitalize'}
                  borderRightWidth={'1px'}
                  borderColor={'mybg'}
                >
                  Amount
                </Th>
                <Th
                  color={'white'}
                  fontSize={'14px'}
                  fontWeight={'600'}
                  textTransform={'capitalize'}
                  borderRightWidth={'1px'}
                  borderColor={'mybg'}
                >
                  Transaction type
                </Th>
                <Th
                  color={'white'}
                  fontSize={'14px'}
                  fontWeight={'600'}
                  textTransform={'capitalize'}
                  borderRightWidth={'1px'}
                  borderColor={'mybg'}
                >
                  Transaction hash
                </Th>
                <Th
                  color={'white'}
                  fontSize={'14px'}
                  fontWeight={'600'}
                  textTransform={'capitalize'}
                  borderTopRightRadius={'lg'}
                  borderBottomRightRadius={'lg'}
                >
                  Time
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {transactions.map((tx, index) => {
                const token = getTokenInfoFromAddr(tx.asset);
                const decimals = token?.decimals;

                return (
                  <Tr
                    key={index}
                    className="faded-purple-gradient"
                    border={'none'}
                  >
                    <Td
                      color={'text_secondary'}
                      fontSize={'14px'}
                      borderTopLeftRadius="8px"
                      borderBottomLeftRadius="8px"
                    >
                      {index + 1}.
                    </Td>
                    <Td color={'text_secondary'} fontSize={'14px'}>
                      {Number(
                        new MyNumber(
                          tx.amount,
                          decimals!,
                        ).toEtherToFixedDecimals(token.displayDecimals),
                      ).toLocaleString()}{' '}
                      {token?.name}
                    </Td>
                    <Td color={'text_secondary'} fontSize={'14px'}>
                      <Flex alignItems={'center'} gap={'8px'}>
                        {tx.type === 'deposit' ? (
                          <Box
                            bg={'light_green'}
                            padding={'4px'}
                            borderRadius={'50%'}
                            width={'24px'}
                            height={'24px'}
                            display={'flex'}
                            alignItems={'center'}
                            justifyContent={'center'}
                          >
                            <ArrowDownIcon color={'black'} />
                          </Box>
                        ) : (
                          <Box
                            bg={'red_2'}
                            padding={'4px'}
                            borderRadius={'50%'}
                            width={'24px'}
                            height={'24px'}
                            display={'flex'}
                            alignItems={'center'}
                            justifyContent={'center'}
                          >
                            <ArrowUpIcon color={'black'} />
                          </Box>
                        )}

                        {capitalize(tx.type)}
                      </Flex>
                    </Td>
                    <Td color={'text_secondary'} fontSize={'14px'}>
                      <Text
                        width={'100%'}
                        fontWeight={'600'}
                        color={'text_secondary'}
                      >
                        <Link
                          href={`${CONSTANTS.BLOCK_EXPLORER}/tx/${tx.txHash}`}
                          target="_blank"
                        >
                          {shortAddress(tx.txHash)} <ExternalLinkIcon />
                        </Link>
                      </Text>
                    </Td>
                    <Td
                      color={'text_secondary'}
                      fontSize={'14px'}
                      borderTopRightRadius="8px"
                      borderBottomRightRadius="8px"
                    >
                      <Text width={'100%'}>
                        {timeAgo(new Date(tx.timestamp * 1000))}
                      </Text>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </>
    )
  );
}

function MobileTransactionHistory(props: { transactions: ITransaction[] }) {
  const { transactions: transactions } = props;

  return (
    <>
      {transactions.map((tx, index) => {
        const token = getTokenInfoFromAddr(tx.asset);
        const decimals = token?.decimals;
        const isDeposit = tx.type === 'deposit';

        return (
          <Box
            key={index}
            borderRadius="lg"
            bg="bg_2"
            display="flex"
            flexDirection="column"
            gap={1}
            padding={'16px'}
          >
            <Flex alignItems="center" gap={2} mb={1}>
              <Box
                bg={isDeposit ? 'light_green' : 'red_2'}
                padding="4px"
                borderRadius="50%"
                width="24px"
                height="24px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {isDeposit ? (
                  <ArrowDownIcon color={'black'} />
                ) : (
                  <ArrowUpIcon color={'black'} />
                )}
              </Box>
              <Text
                fontWeight="bold"
                color={isDeposit ? 'light_green' : 'red_2'}
                fontSize="15px"
              >
                {isDeposit ? 'Deposited' : 'Withdrawn'}
              </Text>
            </Flex>
            <Text color="white" fontSize="15px">
              Amount:{' '}
              {Number(
                new MyNumber(tx.amount, decimals!).toEtherToFixedDecimals(
                  token.displayDecimals,
                ),
              ).toLocaleString()}{' '}
              {token?.name}
            </Text>
            <Text color="white" fontSize="13px">
              Tx Hash:{' '}
              <Link
                href={`${CONSTANTS.BLOCK_EXPLORER}/tx/${tx.txHash}`}
                target="_blank"
                color="color_7"
              >
                {shortAddress(tx.txHash)}
              </Link>
            </Text>
            <Text color="text_secondary" fontSize="13px">
              {timeAgo(new Date(tx.timestamp * 1000))}
            </Text>
          </Box>
        );
      })}
    </>
  );
}

export function TransactionsTab(props: TransactionsTabProps) {
  const { address } = useAccount();
  const { strategy, txHistory, isMobile } = props;

  return (
    <Box background="black">
      <Flex
        maxWidth={'1152px'}
        margin={'0 auto'}
        flexDirection="column"
        gap="16px"
        width="100%"
        padding={'32px 0px'}
      >
        <Box>
          <Text fontSize="18px" color="white" fontWeight="600" mb={1}>
            Transaction history
          </Text>
          {!strategy.settings.isTransactionHistDisabled && (
            <Text fontSize="14px" color="border_light" mb={2}>
              There may be delays in fetching data. If your transaction
              isn&apos;t found, try again later.
            </Text>
          )}
        </Box>
        {address ? (
          strategy.settings.isTransactionHistDisabled ? (
            <Text
              fontSize={'14px'}
              textAlign={'center'}
              color="text_secondary"
              marginTop={'20px'}
              padding="16px"
              bg="mycard"
              borderRadius={'lg'}
            >
              Transaction history is not available for this strategy yet. If
              enabled in future, will include the entire history.
            </Text>
          ) : txHistory.findManyInvestment_flows.length !== 0 ? (
            isMobile ? (
              <MobileTransactionHistory
                transactions={txHistory.findManyInvestment_flows}
              />
            ) : (
              <DesktopTransactionHistory
                transactions={txHistory.findManyInvestment_flows}
              />
            )
          ) : (
            <Text fontSize={'14px'} textAlign={'center'} color="text_secondary">
              No transactions found
            </Text>
          )
        ) : (
          <Text
            fontSize={'14px'}
            textAlign={'center'}
            color="text_secondary"
            padding="16px"
            bg="mycard"
            borderRadius={'lg'}
          >
            Connect your wallet to view transaction history
          </Text>
        )}
      </Flex>
    </Box>
  );
}
