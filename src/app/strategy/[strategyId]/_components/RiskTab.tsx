import {
  Badge,
  Box,
  Flex,
  ListItem,
  OrderedList,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { StrategyInfo } from '@/store/strategies.atoms';
import { getRiskColor, getRiskExplaination, RiskFactor } from '@strkfarm/sdk';
import { useMemo } from 'react';
import { MYSTYLES } from '@/style';
import { getRiskString } from '@/strategies/IStrategy';

interface RiskTabProps {
  strategy: StrategyInfo<any>;
  isMobile?: boolean;
}

export function RiskTab(props: RiskTabProps) {
  const { strategy, isMobile } = props;

  function getToolTip(risk: RiskFactor) {
    return (
      <Box color={'text_secondary'}>
        <Text>
          <b>Definition:</b> {getRiskExplaination(risk.type)}
        </Text>
        {risk.reason && (
          <Text mt={2} fontSize={'sm'}>
            <b>Justification:</b> {risk.reason}
          </Text>
        )}
      </Box>
    );
  }

  const risks = useMemo(() => {
    const _risks = strategy.metadata.risk.riskFactor.map((risk) => ({
      type: risk.type.toLowerCase(),
      value: risk.value,
      color: getRiskColor(risk),
      toolTip: getToolTip(risk),
    }));
    const noRisks = strategy.metadata.risk.notARisks.map((risk) => ({
      type: risk.toLowerCase(),
      value: 0,
      color: 'text_secondary',
      toolTip: getToolTip({
        type: risk,
        value: 0,
        weight: 0,
        reason: 'This risk is not applicable to this strategy.',
      }),
    }));
    return [..._risks, ...noRisks];
  }, [strategy.metadata.risk.riskFactor, strategy.metadata.risk.notARisks]);

  return (
    <Box background="black">
      <Flex
        maxWidth={'1152px'}
        margin={'0 auto'}
        padding={'16px 0px'}
        gap={'24px'}
        direction={'column'}
      >
        {risks.length > 0 && (
          <Box>
            <Text color={'text_primary'} mb={'10px'}>
              Risk Assessment
            </Text>
            <Flex wrap={'wrap'} gap={2}>
              {risks.map((risk, index) => (
                <Tooltip
                  label={risk.toolTip}
                  key={index}
                  {...MYSTYLES.TOOLTIP.STANDARD}
                >
                  <Badge
                    padding={'8px 16px'}
                    borderRadius={'2xl'}
                    bg={'mycard_light_2x'}
                    color={risk.color}
                    textTransform={'capitalize'}
                  >
                    {risk.type}: {getRiskString(risk.value)}
                  </Badge>
                </Tooltip>
              ))}
            </Flex>
          </Box>
        )}
        <Box>
          <Text color={'text_primary'} mb={'10px'}>
            Risk details
          </Text>
          <Flex
            width={'100%'}
            maxWidth={'500px'}
            flexDirection={'column'}
            gap={'16px'}
          >
            <OrderedList
              fontSize={'14px'}
              fontWeight={'400'}
              color={'border_light'}
              listStyleType="none"
              css={{
                '& li': {
                  position: 'relative',
                  paddingLeft: '2.5em',

                  '&::before': {
                    content: 'attr(data-number)',
                    position: 'absolute',
                    left: '10px',
                    top: '12px',
                    padding: '4px 8px',
                    color: 'white',
                    fontSize: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#37373766',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                },
              }}
              display={'flex'}
              marginLeft={0}
              flexDirection={'column'}
              gap={'16px'}
            >
              {strategy.risks.map((r, index) => (
                <ListItem
                  className="faded-purple-gradient"
                  color="text_secondary"
                  key={r}
                  width={'fit-content'}
                  fontSize={'14px'}
                  fontWeight={'500'}
                  alignItems={'justify'}
                  padding={'10px'}
                  borderRadius={'8px'}
                  data-number={index + 1}
                >
                  {r}
                  {index === 0 && (
                    <Badge
                      padding={'4px 8px'}
                      borderRadius={'4px'}
                      bg={
                        strategy.riskFactor <= 1
                          ? 'light_green_2'
                          : strategy.riskFactor < 3
                            ? 'yellow_2'
                            : 'red_2'
                      }
                      color={'black'}
                      fontSize={'10px'}
                      fontWeight={'500'}
                      textTransform={'none'}
                      marginLeft={'10px'}
                    >
                      {getRiskString(strategy.riskFactor)}
                      {' risk'}
                    </Badge>
                  )}
                </ListItem>
              ))}
            </OrderedList>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}
