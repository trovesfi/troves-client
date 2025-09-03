import { Box, Flex, Text } from '@chakra-ui/react';
import React from 'react';

import { StrategyInfo } from '@/store/strategies.atoms';
import { TokenDeposit } from './TokenDeposit';
import { ContractDetails } from '@/components/ContractDetails';

interface ManageTabProps {
  strategy: StrategyInfo<any>;
  isMobile?: boolean;
}

export function ManageTab(props: ManageTabProps) {
  const { strategy, isMobile } = props;

  return (
    <Box background="black">
      <Flex
        maxWidth={'1152px'}
        margin={'0 auto'}
        padding={'32px 0px'}
        gap={'2'}
        direction={{ base: 'column-reverse', md: 'row' }}
      >
        <Flex
          width={'100%'}
          flexDirection={'column'}
          gap={'16px'}
          padding={'16px'}
          borderRadius={'lg'}
          className="faded-purple-gradient "
        >
          <Text fontSize={'24px'} fontWeight={'600'} color={'text_secondary'}>
            How does it work?
          </Text>
          {/* <UnorderedList
          fontSize={'14px'}
          fontWeight={'400'}
          color={'text_secondary'}
        >
          <ListItem>
            Deposit USDC to automatically loop funds between zkLend and Nostra.
          </ListItem>
          <ListItem>
            Creates a delta-neutral position to maximize USDC yield.
          </ListItem>
          <ListItem>
            Position is periodically adjusted to maintain a healthy health
            factor
          </ListItem>
          <ListItem>
            Receive an NFT as representation for your stake on Troves.
          </ListItem>
          <ListItem>Withdraw anytime by redeeming your NFT for USDC.</ListItem>
        </UnorderedList> */}
          <Box color={'text_secondary'} fontSize={'14px'}>
            {strategy.description}
          </Box>

          <ContractDetails strategy={strategy} />
          {/* <VStack alignItems={'flex-start'} gap={'8px'}>
          <Text fontSize={'24px'} fontWeight={'600'} color={'white'}>
            Risks
          </Text>
          <Box>
          {strategy.metadata.risk.riskFactor.map((r: any, i: number) => (
            <Tooltip label={getRiskExplaination(r.type)} key={i}>
              <Badge 
                padding={'5px 10px'} mr={'5px'} 
                borderRadius={'10px'} 
                color={'text_secondary'}
                bg='mycard_light_2x'
              >
                {r.type.valueOf()}
              </Badge>
            </Tooltip>
          ))}
          </Box>
        </VStack> */}
        </Flex>

        <Flex
          width={{ base: '100%', md: '50%' }}
          minWidth={{ base: '100%', md: '450px' }}
          maxWidth={{ base: '100%', md: '500px' }}
          borderRadius={'lg'}
          className="faded-purple-gradient"
        >
          {!strategy ||
            (strategy.isSingleTokenDepositView && (
              <TokenDeposit strategy={strategy} isDualToken={false} />
            ))}
          {strategy && !strategy.isSingleTokenDepositView && (
            <TokenDeposit strategy={strategy} isDualToken={true} />
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
