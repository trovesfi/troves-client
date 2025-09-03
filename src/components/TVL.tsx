import { addressAtom } from '@/store/claims.atoms';
import { referralCodeAtom } from '@/store/referral.store';
import { strategiesAtom } from '@/store/strategies.atoms';
import { dAppStatsAtom, userStatsAtom } from '@/store/utils.atoms';
import { MYSTYLES } from '@/style';
import { copyReferralLink, getHosturl } from '@/utils';
import { CopyIcon } from '@chakra-ui/icons';
import {
  Box,
  Card,
  Grid,
  GridItem,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Tooltip,
} from '@chakra-ui/react';
import { useAtomValue } from 'jotai';
import Link from 'next/link';
import React from 'react';

const TVL: React.FC = () => {
  const _strategies = useAtomValue(strategiesAtom);
  const { data, isPending } = useAtomValue(dAppStatsAtom);
  const { data: userData, isPending: userStatsPending } =
    useAtomValue(userStatsAtom);

  const address = useAtomValue(addressAtom);
  const referralCode = useAtomValue(referralCodeAtom);

  const formattedTvlData = (tvlData: number) => {
    if (tvlData >= 1000000) {
      return `${(tvlData / 1000000).toFixed(2)}m`;
    } else if (tvlData >= 1000) {
      return `${(tvlData / 1000).toFixed(2)}k`;
    }
    return `${tvlData.toString()}`;
  };

  return (
    <Grid
      templateColumns={{ base: 'repeat(1, 1, 1fr)', md: 'repeat(3, 1fr)' }}
      gap="2"
      width="100%"
    >
      <GridItem
        display="flex"
        className="faded-purple-gradient"
        borderRadius={'8px'}
      >
        <Card
          // className="faded-purple-gradient"
          width={'100%'}
          padding={'15px 30px'}
          color={'white'}
          bg={'transparent'}
          // bg={'mycard'}
          // borderWidth={'1px'}
          // borderColor={'color_3'}
        >
          <Stat>
            <StatLabel {...MYSTYLES.TEXT.H2Label}>
              Total Value locked (TVL)
            </StatLabel>
            <StatNumber {...MYSTYLES.TEXT.H1Label}>
              $
              {isPending ? (
                <Spinner size="sm" color="white" marginLeft={'5px'} />
              ) : data !== undefined ? (
                formattedTvlData(Number(data.tvl))
              ) : (
                '0'
              )}
            </StatNumber>
          </Stat>
        </Card>
      </GridItem>

      <GridItem
        display="flex"
        className="faded-purple-gradient"
        borderRadius={'8px'}
      >
        <Card
          // className="faded-purple-gradient"
          width={'100%'}
          padding={'15px 30px'}
          color={'white'}
          bg={'transparent'}
          // bg={'mycard'}
          // borderWidth={'1px'}
          // borderColor={'color_3'}
        >
          <Stat>
            <StatLabel {...MYSTYLES.TEXT.H2Label}>Your holdings</StatLabel>
            <StatNumber {...MYSTYLES.TEXT.H1Label}>
              $
              {userStatsPending ? (
                <Spinner size="sm" color="white" marginLeft={'5px'} />
              ) : !userData ? (
                0
              ) : (
                Number(userData?.holdingsUSD?.toFixed(2)).toLocaleString()
              )}
            </StatNumber>
          </Stat>
        </Card>
      </GridItem>

      <GridItem
        display="flex"
        className="faded-purple-gradient"
        borderRadius={'8px'}
      >
        <Card
          width={'100%'}
          padding={'15px 30px'}
          color={'white'}
          bg={'transparent'}
          // borderWidth={'1px'}
          // borderColor={'color_3'}
        >
          <Stat>
            <StatLabel {...MYSTYLES.TEXT.H2Label}>
              Your referral link{' '}
              <Tooltip label="Learn more">
                {/* TODO: update the url */}
                <Link
                  href={`https://docs.${getHosturl()}/p/community/referral-campaign`}
                  target="_blank"
                >
                  (i)
                </Link>
              </Tooltip>
            </StatLabel>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              {address ? (
                !referralCode ? (
                  <Spinner size="sm" color="white" marginTop={'8px'} />
                ) : (
                  <StatNumber
                    textDecoration="underline"
                    fontWeight="600"
                    cursor={'pointer'}
                    onClick={() => {
                      copyReferralLink(referralCode);
                    }}
                    {...MYSTYLES.TEXT.H1Label}
                  >
                    {referralCode}
                  </StatNumber>
                )
              ) : (
                <Tooltip label="Connect wallet">
                  <StatNumber fontSize={{ base: '20px' }} fontWeight="600">
                    -
                  </StatNumber>
                </Tooltip>
              )}

              {address && (
                <CopyIcon
                  cursor="pointer"
                  onClick={() => {
                    copyReferralLink(referralCode);
                  }}
                />
              )}
            </Box>
          </Stat>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default TVL;
