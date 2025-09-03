import { Box, Center, Spinner, Flex, Text } from '@chakra-ui/react';
import { TrovesStrategyAPIResult } from '@/store/troves.atoms';
import FlowChart from './FlowChart';
import DepositActionIcon from '@/assets/depositAction.svg';
import WithdrawActionIcon from '@/assets/withdrawAction.svg';
import LoopActionIcon from '@/assets/loopAction.svg';
import { useMemo } from 'react';
import { StrategyInfo } from '@/store/strategies.atoms';

interface DetailsTabProps {
  strategy: StrategyInfo<any>;
  strategyAPIResult: TrovesStrategyAPIResult;
  isMobile?: boolean;
}

export function DetailsTab(props: DetailsTabProps) {
  const { strategy, strategyAPIResult, isMobile } = props;

  const steps = useMemo(() => {
    if (strategyAPIResult.actions.length > 0) {
      const res: string[] = strategyAPIResult.actions
        .filter((action) => action.name != undefined) // Filter out empty action names
        .map((action) => action.name);
      return res;
    }
    if (strategy.metadata.investmentSteps.length > 0) {
      return strategy.metadata.investmentSteps;
    }
    return [];
  }, [strategyAPIResult.actions, strategy.metadata.investmentSteps]);

  return (
    <Box background="black">
      <Flex
        maxWidth={'1152px'}
        margin={'0 auto'}
        padding={'32px 0px'}
        gap={'24px'}
      >
        <Flex width={'100%'} flexDirection={'column'} gap={5}>
          {steps.length > 0 && (
            <Flex
              flexDirection={'column'}
              gap={'16px'}
              padding={'0 16px'}
              width={'100%'}
            >
              <>
                <Text fontSize={'24px'} fontWeight={'600'} color={'white'}>
                  Steps performed by the strategy
                </Text>
                {steps.map((action, index) => (
                  <Box
                    className="text-cell faded-purple-gradient"
                    display={{ base: 'block', md: 'flex' }}
                    alignItems={'center'}
                    key={index}
                    width={'100%'}
                    fontSize={'14px'}
                    borderRadius={'8px'}
                    padding={'10px'}
                  >
                    {action.toLowerCase().includes('stake') ||
                    action.toLowerCase().includes('supply') ? (
                      <DepositActionIcon />
                    ) : action.toLowerCase().includes('borrow') ? (
                      <WithdrawActionIcon />
                    ) : (
                      <LoopActionIcon />
                    )}
                    <Text padding={'5px 10px'} color={'border_light'}>
                      {action}
                    </Text>
                  </Box>
                ))}
                {steps.length == 0 && (
                  <Center width={'100%'} padding={'10px'}>
                    <Spinner size={'xs'} color="white" />
                  </Center>
                )}
              </>
            </Flex>
          )}

          {strategyAPIResult.investmentFlows.length > 0 && (
            <Box
              width={'100%'}
              padding={'0 16px'}
              borderRadius={'lg'}
              display={{ base: 'none', md: 'block' }}
            >
              <Text
                fontSize={'20px'}
                color={'text_secondary'}
                fontWeight={'bold'}
                marginBottom={'5px'}
              >
                Configuration
              </Text>
              <FlowChart strategyId={strategy.id} />
            </Box>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
