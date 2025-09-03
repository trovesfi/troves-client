import React, { useMemo } from 'react';
import { Box, Flex, Text, Tooltip } from '@chakra-ui/react';
import { useAccount } from '@starknet-react/core';
import { StrategyInfo } from '@/store/strategies.atoms';
import { HarvestTimeAtom } from '@/store/harvest.atom';
import { useAtomValue } from 'jotai';
import { formatTimediff, getDisplayCurrencyAmount } from '@/utils';

interface HarvestTimeProps {
  strategy: StrategyInfo<any>;
  balData: any;
}

const HarvestTime: React.FC<HarvestTimeProps> = ({ strategy, balData }) => {
  const { address } = useAccount();
  const holdingToken: any = strategy.holdingTokens[0];
  const contractAddress = holdingToken.address || holdingToken.token || '';

  const harvestTimeAtom = useMemo(
    () => HarvestTimeAtom(contractAddress),
    [address],
  );

  const harvestTime = useAtomValue(harvestTimeAtom);

  const data = harvestTime.data?.findManyHarvests[0];

  const lastHarvest = useMemo(() => {
    if (!data || !data.timestamp) return null;
    return new Date(Number(data.timestamp) * 1000);
  }, [data?.timestamp]);

  const harvestTimestamp = useMemo(() => {
    const DAYMS = 86400 * 1000;
    // Base date is last harvest time + 2 days or now (for no harvest strats)
    const baseDate = lastHarvest
      ? new Date(lastHarvest.getTime() + 2 * DAYMS)
      : new Date();

    // With base date, get next sunday 12am UTC
    // set date to coming sunday in UTC
    const nextHarvest = baseDate;
    nextHarvest.setUTCDate(
      nextHarvest.getUTCDate() + (7 - nextHarvest.getUTCDay()),
    );
    nextHarvest.setUTCHours(0);
    nextHarvest.setUTCMinutes(0);
    nextHarvest.setUTCSeconds(0);

    // if nextHarvest is within 24hrs of last harvest,
    // increase it by 7 days
    // This is needed as harvest can happen anytime near deadline
    if (
      lastHarvest &&
      nextHarvest.getTime() - lastHarvest.getTime() < 86400 * 1000
    ) {
      nextHarvest.setUTCDate(nextHarvest.getUTCDate() + 7);
    }

    return formatTimediff(nextHarvest);
  }, [data?.timestamp, lastHarvest]);

  return (
    <Flex
      width={'100%'}
      flexDirection={{ base: 'column', md: 'row' }}
      borderRadius={'lg'}
      className="faded-purple-gradient "
    >
      <Flex width={'100%'} justifyContent="space-between">
        {!strategy.settings.hideHarvestInfo && (
          <Tooltip
            label={`This is when your investment increases as STRK rewards are automatically claimed and reinvested into the strategy's tokens.`}
          >
            <Flex
              alignItems={'center'}
              gap={'2'}
              padding={'16px'}
              width={'100%'}
              direction={'column'}
            >
              <Box
                color="text_secondary"
                fontSize="14px"
                fontWeight="500"
                display={'flex'}
                gap={2}
                width={'100%'}
                justifyContent={'space-between'}
              >
                <Text style={{ width: '100%' }}>Next Harvest in:</Text>
                {harvestTimestamp.isZero && (
                  <Text
                    color={'purple'}
                    width="100%"
                    fontWeight={'bold'}
                    marginLeft={'5px'}
                    textAlign={'right'}
                  >
                    Anytime now
                  </Text>
                )}
              </Box>

              <Box
                display="flex"
                alignItems="center"
                gap="10px"
                width={'100%'}
                justifyContent="space-between"
              >
                {[
                  {
                    label: 'Days',
                    value: harvestTimestamp.days ?? 0,
                  },
                  {
                    label: 'Hrs',
                    value: harvestTimestamp.hours ?? 0,
                  },
                  {
                    label: 'Min',
                    value: harvestTimestamp.minutes ?? 0,
                  },
                  {
                    label: 'Sec',
                    value: harvestTimestamp.seconds ?? 0,
                  },
                ].map((item, index) => (
                  <Box
                    key={index}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexDirection="column"
                    gap="4px"
                    bg={'mycard_light_2x'}
                    width="53px"
                    height="53px"
                    borderRadius="8px"
                  >
                    <Text
                      color="text_secondary"
                      fontSize="12px"
                      fontWeight="300"
                    >
                      {item.label}
                    </Text>
                    <Text
                      color="text_primary"
                      fontSize={'16px'}
                      fontWeight={'600'}
                    >
                      {item.value}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Flex>
          </Tooltip>
        )}
      </Flex>

      <Flex justifyContent={'space-between'} width={'100%'}>
        {!strategy.settings.hideHarvestInfo && (
          <Flex
            padding={{ base: '0 16px 16px', md: '16px 16px 16px 0' }}
            alignItems={'center'}
            gap={'2'}
            direction={{ base: 'column' }}
            width={'100%'}
            justifyContent={'end'}
          >
            <Text
              color={'text_secondary'}
              fontSize={'12px'}
              fontWeight={'400'}
              lineHeight={'100%'}
              width={'100%'}
              borderRadius={'lg'}
            >
              Total rewards harvested:{' '}
              <Text as="span" color="white" fontWeight={'bold'}>
                {getDisplayCurrencyAmount(
                  harvestTime?.data?.totalStrkHarvestedByContract.STRKAmount ||
                    0,
                  2,
                )}{' '}
              </Text>
              STRK
            </Text>

            <Text
              color={'text_secondary'}
              fontSize={'12px'}
              fontWeight={'400'}
              lineHeight={'100%'}
              width={'100%'}
              borderRadius={'lg'}
            >
              Total number of times harvested:{' '}
              <Text as="span" color="white" fontWeight={'bold'}>
                {harvestTime?.data?.totalHarvestsByContract || '-'}
              </Text>
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default HarvestTime;
