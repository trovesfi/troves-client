import Deposit from '@/components/Deposit';
import { StrategyInfo } from '@/store/strategies.atoms';
import {
  Alert,
  AlertIcon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';

interface TokenDepositProps {
  strategy: StrategyInfo<any>;
  isDualToken?: boolean;
}

export function TokenDeposit(props: TokenDepositProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const { strategy } = props;
  return (
    <Tabs
      bg="transparent"
      position="relative"
      variant="unstyled"
      width={'100%'}
      onChange={(index) => {
        setTabIndex(index);
      }}
    >
      <TabList borderRadius={'8px'}>
        <Tab
          width={'100%'}
          color="text_black_70p"
          fontSize={'14px'}
          fontWeight={'700'}
          borderTopLeftRadius={'8px'}
          bg="purple_30p"
          _selected={{ bg: 'purple', color: 'black' }}
          onClick={() => {
            // mixpanel.track('All pools clicked')
          }}
        >
          Deposit
        </Tab>
        <Tab
          width={'100%'}
          fontSize={'14px'}
          fontWeight={'700'}
          borderTopRightRadius={'8px'}
          bg="purple_30p"
          color="text_black_70p"
          _selected={{ bg: 'purple', color: 'black' }}
          onClick={() => {
            // mixpanel.track('Strategies opened')
          }}
        >
          Withdraw
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel
          width={'100%'}
          padding={'20px 16px'}
          borderBottomLeftRadius={'8px'}
          borderBottomRightRadius={'8px'}
        >
          {tabIndex == 0 && (
            <>
              <Deposit
                strategy={strategy}
                buttonText="Deposit"
                callsInfo={strategy.depositMethods}
                isDualToken={props.isDualToken || false}
              />
              {strategy.settings.alerts != undefined && (
                <VStack mt={'20px'}>
                  {strategy.settings.alerts
                    .filter((a) => a.tab == 'deposit' || a.tab == 'all')
                    .map((alert, index) => (
                      <Alert
                        status={alert.type}
                        fontSize={'12px'}
                        color={'text_secondary'}
                        borderRadius={'10px'}
                        bg="mycard"
                        padding={'10px'}
                        key={index}
                      >
                        <AlertIcon />
                        {alert.text}
                      </Alert>
                    ))}
                </VStack>
              )}
            </>
          )}
        </TabPanel>
        <TabPanel
          width={'100%'}
          padding={'20px 16px'}
          borderBottomLeftRadius={'8px'}
          borderBottomRightRadius={'8px'}
        >
          {tabIndex == 1 && (
            <>
              <Deposit
                strategy={strategy}
                buttonText="Redeem"
                callsInfo={strategy.withdrawMethods}
                isDualToken={props.isDualToken || false}
              />
              {strategy.settings.alerts != undefined && (
                <VStack mt={'20px'}>
                  {strategy.settings.alerts
                    .filter((a) => a.tab == 'withdraw' || a.tab == 'all')
                    .map((alert, index) => (
                      <Alert
                        status={alert.type}
                        fontSize={'12px'}
                        color={'text_secondary'}
                        borderRadius={'10px'}
                        bg="mycard"
                        padding={'10px'}
                        key={index}
                      >
                        <AlertIcon />
                        {alert.text}
                      </Alert>
                    ))}
                </VStack>
              )}
            </>
          )}
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
