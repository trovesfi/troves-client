import ShieldIcon from '@/assets/shield.svg';
import { addressAtom } from '@/store/claims.atoms';
import { isPoolRetired, PoolInfo } from '@/store/pools';
import { getPoolInfoFromStrategy, sortAtom } from '@/store/protocols';
import { strategiesAtom } from '@/store/strategies.atoms';
import { TrovesStrategyAPIResult } from '@/store/troves.atoms';
import { UserStats, userStatsAtom } from '@/store/utils.atoms';
import { isLive, StrategyLiveStatus } from '@/strategies/IStrategy';
import { getDisplayCurrencyAmount } from '@/utils';
import { ArrowDownIcon, ArrowUpIcon } from '@chakra-ui/icons';
import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Image,
  Link,
  Spinner,
  Stack,
  Td,
  Text,
  Tooltip,
  Tr,
  VStack,
} from '@chakra-ui/react';
import { ContractAddr } from '@strkfarm/sdk';
import { useAtomValue } from 'jotai';
import mixpanel from 'mixpanel-browser';
import { useMemo } from 'react';

export interface YieldCardProps {
  pool: PoolInfo;
  index: number;
  showProtocolName?: boolean;
  showBalance?: boolean;
}

export function getStratCardBg(status: StrategyLiveStatus, index: number) {
  // if (isLive(status)) {
  //   return index % 2 === 0 ? 'mycard_dark' : 'mycard_dark';
  // }
  // if (status == StrategyLiveStatus.RETIRED) {
  //   return 'black';
  // }
  // return 'bg';
  return 'mycard_dark';
}

function getStratCardBadgeBg(status: StrategyLiveStatus) {
  if (isLive(status)) {
    return 'badge_blue';
  } else if (status === StrategyLiveStatus.COMING_SOON) {
    return 'yellow';
  } else if (status === StrategyLiveStatus.RETIRED) {
    return 'grey';
  }
  return 'bg';
}

export function StrategyInfo(props: YieldCardProps) {
  const { pool } = props;

  const tags = useMemo(() => {
    if (!pool.additional || !pool.additional.tags) return [];
    return pool.additional.tags.filter(
      (tag) => tag != StrategyLiveStatus.ACTIVE,
    );
  }, [pool.additional]);

  return (
    <Box>
      <HStack spacing={2}>
        <AvatarGroup
          size={{ base: 'sm', md: 'sm' }}
          max={3}
          marginRight={'10px'}
        >
          {pool.pool.logos.map((logo, index) => (
            <Avatar key={index} src={logo} />
          ))}
        </AvatarGroup>
        <VStack gap={1}>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={2}>
            <Flex gap={2}>
              <Heading
                marginTop={'2px'}
                fontSize={'1.2rem'}
                fontWeight={'600'}
                color={isPoolRetired(pool) ? 'grey' : 'text_primary'}
              >
                {pool.pool.name}
              </Heading>
              {pool.additional && pool.additional.auditUrl && (
                <Tooltip label="Audited smart contract. Click to view the audit report.">
                  <Link href={pool.additional.auditUrl} target="_blank">
                    <Box
                      width={'24px'}
                      height={'24px'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      borderRadius={'50%'}
                      bg={'badge_green'}
                      padding={'3px 5px'}
                    >
                      <ShieldIcon />
                    </Box>
                  </Link>
                </Tooltip>
              )}
            </Flex>
            {tags.length > 0 && (
              <Box>
                <Flex gap={2}>
                  {tags.map((tag) => {
                    return (
                      <Badge
                        bg={getStratCardBadgeBg(tag)}
                        fontFamily={'sans-serif'}
                        padding="4px 8px"
                        textTransform="capitalize"
                        fontWeight={500}
                        key={tag}
                        color={'text_secondary'}
                      >
                        {tag}
                      </Badge>
                    );
                  })}
                </Flex>
              </Box>
            )}
          </Stack>
          {props.showProtocolName && (
            <HStack marginTop={'5px'} spacing={1} width={'100%'}>
              <Avatar size={'2xs'} src={pool.protocol.logo} />
              <Heading
                fontSize={'14px'}
                fontWeight={'400'}
                color={'text_secondary'}
              >
                {pool.protocol.name}
              </Heading>
            </HStack>
          )}
        </VStack>
      </HStack>
    </Box>
  );
}

function getAPRWithToolTip(pool: PoolInfo) {
  const tip = (
    <Box width={'300px'}>
      {pool.aprSplits.map((split) => {
        return (
          <Flex width={'100%'} key={split.title}>
            <Text key="1" width={'70%'}>
              {split.title} {split.description ? `(${split.description})` : ''}
            </Text>
            <Text fontSize={'xs'} width={'30%'} textAlign={'left'} key="2">
              {split.apr === 'Err' ? split.apr : (split.apr * 100).toFixed(2)}%
            </Text>
          </Flex>
        );
      })}
    </Box>
  );
  return (
    <Tooltip hasArrow label={tip} bg="gray.300" color="black">
      <Box
        width={'100%'}
        marginRight={'0px'}
        marginLeft={'auto'}
        display={'flex'}
        justifyContent={'flex-end'}
      >
        {pool.isLoading && <Spinner />}
        {!pool.isLoading && (
          <>
            <Text
              textAlign={'left'}
              color="purple"
              fontSize={'1rem'}
              fontWeight={'600'}
            >
              {(pool.apr * 100).toFixed(2)}%
            </Text>
          </>
        )}
      </Box>
    </Tooltip>
  );
}

function PointsMultiplier(props: {
  points: { multiplier: number; logo: string; toolTip?: string }[];
}) {
  const { points } = props;
  return (
    <Box display={'flex'} justifyContent={'flex-end'} width={'100%'}>
      <Box padding={'2px 5px'} bg={'bg'} borderRadius={'15px'}>
        {points.map((point, index) => (
          <Box display={'flex'} justifyContent={'flex-end'} key={index}>
            <Tooltip label={point.toolTip} fontSize={'13px'}>
              <Box
                display={'flex'}
                gap={'5px'}
                alignItems={'center'}
                fontSize={'12px'}
                textColor={'light_grey'}
              >
                <Text>{point.multiplier}x</Text>
                <Text>Points</Text>
                <Avatar src={point.logo} size="2xs" />
              </Box>
            </Tooltip>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function StrategyAPY(props: YieldCardProps) {
  const { pool } = props;
  const isRetired = useMemo(() => {
    return isPoolRetired(pool);
  }, [pool]);

  const strategies = useAtomValue(strategiesAtom);

  const strategy = useMemo(() => {
    return strategies.find((s) => s.id === pool.pool.id);
  }, [strategies, pool.pool.id]);

  return (
    <Box width={'100%'}>
      {isRetired ? (
        <Text ml="auto" w="fit-content" mr="6">
          -
        </Text>
      ) : (
        <Box display={'flex'} flexDirection={'column'} gap={2}>
          {getAPRWithToolTip(pool)}

          {pool.aprSplits.length &&
            pool.aprSplits.some((a) => a.title == 'Rewards APY') && (
              <Tooltip
                label="Boosted rewards from Troves"
                bg="gray.300"
                color="black"
              >
                <Box width={'100%'}>
                  <Box float={'right'} display={'flex'} fontSize={'13px'}>
                    <Text color="#FCC01E" textAlign={'right'}>
                      ⚡
                    </Text>
                    <Text
                      width="100%"
                      color="cyan"
                      textAlign={'right'}
                      fontWeight={600}
                    >
                      Boosted
                    </Text>
                  </Box>
                </Box>
              </Tooltip>
            )}
          {strategy != undefined && strategy.metadata.points != undefined && (
            <PointsMultiplier points={strategy.metadata.points} />
          )}
        </Box>
      )}
    </Box>
  );
}

export function getStrategyWiseHoldingsInfo(
  userData: UserStats | null | undefined,
  id: string,
) {
  const amount = userData?.strategyWise.find((item) => item.id === id);
  const defaultTokenInfo = {
    name: 'N/A',
    symbol: 'N/A',
    address: ContractAddr.from('0x0'),
    decimals: 0,
    logo: '',
    displayDecimals: 2,
  };
  if (!amount) {
    return {
      usdValue: 0,
      amount: 0,
      tokenInfo: defaultTokenInfo,
    };
  }
  return {
    usdValue: amount.usdValue,
    amount: amount.holdings.length ? Number(amount.holdings[0].amount) : 0,
    tokenInfo: amount.holdings.length
      ? amount.holdings[0].tokenInfo
      : defaultTokenInfo,
  };
}

export function StrategyTVL(props: YieldCardProps) {
  const { pool } = props;

  const isPoolLive =
    pool.additional &&
    pool.additional.tags[0] &&
    isLive(pool.additional.tags[0]);

  return (
    <Box
      width={'100%'}
      fontWeight={600}
      display={'flex'}
      flexDirection={'column'}
      justifyContent={'center'}
    >
      {isPoolLive && (
        <Text fontSize={'14px'} fontWeight={'600'} textAlign={'right'}>
          ${getDisplayCurrencyAmount(pool.tvl || 0, 0)}
        </Text>
      )}
      {!isPoolLive && <Text>-</Text>}
    </Box>
  );
}

export function StrategyBalance(props: YieldCardProps) {
  const { pool } = props;
  const address = useAtomValue(addressAtom);
  const { data: userData } = useAtomValue(userStatsAtom);

  const holdingsInfo = getStrategyWiseHoldingsInfo(userData, pool.pool.id);

  const isPoolLive =
    pool.additional &&
    pool.additional.tags[0] &&
    isLive(pool.additional.tags[0]);

  return (
    <Box
      width={'100%'}
      fontWeight={600}
      display={'flex'}
      flexDirection={'column'}
      justifyContent={'center'}
      alignItems={'flex-end'}
      position={'relative'}
    >
      {!isPoolLive && <Text>-</Text>}
      {address && isPoolLive && pool.protocol.name === 'Troves' && (
        <Tooltip label="Your deposits in this Troves strategy">
          <>
            <Text fontSize={'14px'} fontWeight={'600'} textAlign={'right'}>
              ${getDisplayCurrencyAmount(holdingsInfo.usdValue, 0)}
            </Text>
            {holdingsInfo.amount != 0 && (
              <Flex
                justifyContent={'flex-end'}
                marginTop={'-5px'}
                width={'100%'}
                opacity={0.5}
              >
                {/* <Avatar size={'2xs'} src={holdingsInfo.tokenInfo.logo} mr={'2px'}/> */}
                <Text textAlign={'right'} fontSize={'11px'}>
                  {getDisplayCurrencyAmount(
                    holdingsInfo.amount,
                    holdingsInfo.tokenInfo.displayDecimals,
                  ).toLocaleString()}
                </Text>
                <Image
                  width={'10px'}
                  src={holdingsInfo.tokenInfo.logo}
                  ml={'4px'}
                  mr={'1px'}
                  filter={'grayscale(1)'}
                />
              </Flex>
            )}
          </>
        </Tooltip>
      )}
    </Box>
  );
}

// return sort heading text to match with sort options heading text
function sortHeading(field: string) {
  if (field == 'APY') {
    return 'APR';
  }
  return field.toUpperCase();
}

function GetRiskLevel(riskFactor: number) {
  let color = '';
  let bgColor = '';
  let count = 0;
  let tooltipLabel = '';

  if (riskFactor <= 2) {
    color = 'rgba(131, 241, 77, 1)';
    bgColor = 'rgba(131, 241, 77, 0.3)';
    count = 1;
    tooltipLabel = 'Low risk';
  } else if (riskFactor < 4) {
    color = 'rgba(255, 146, 0, 1)';
    bgColor = 'rgba(255, 146, 0, 0.3)';
    count = 3;
    tooltipLabel = 'Medium risk';
  } else {
    color = 'rgba(255, 32, 32, 1)';
    bgColor = 'rgba(255, 32, 32, 0.3)';
    count = 5;
    tooltipLabel = 'High risk';
  }

  return (
    <Box
      width="100%"
      display="flex"
      justifyContent={'flex-start'}
      alignContent={'flex-start'}
    >
      <Tooltip
        hasArrow
        label={`${tooltipLabel}. We currently assess only impermanent loss risk: stable pairs/pools are low risk, volatile multi-token pools are medium risk. More factors will be added soon.`}
        bg="gray.300"
        color="black"
      >
        <Box
          position={'relative'}
          display={'flex'}
          flexDirection={'column'}
          alignSelf={{ base: 'left', md: 'right' }}
          justifyContent={'flex-start'}
          width={'100%'}
        >
          <Box
            width={'100%'}
            display="flex"
            alignItems="center"
            justifyContent={{ base: 'flex-start', md: 'flex-end' }}
            padding={'4px 0px'}
            height={'100%'}
            position={'relative'}
          >
            <Stack direction="row" spacing={1}>
              {[...Array(5)].map((_, index) => (
                <Box
                  key={index}
                  width="4px"
                  height="18px"
                  borderRadius="md"
                  bg={index < count ? color : 'mycard_light_2x'}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </Tooltip>
    </Box>
  );
}

function StrategyMobileCard(props: YieldCardProps) {
  const { pool, index } = props;
  const riskLevel = pool.additional?.riskFactor || 0;
  const isRetired = useMemo(() => {
    return isPoolRetired(pool);
  }, [pool]);

  return (
    <Link {...getLinkProps(pool, props.showProtocolName)} width="100%">
      <Box
        display={{ base: 'flex', md: 'none' }}
        flexDirection="column"
        bg={getStratCardBg(
          pool.additional?.tags?.[0] || StrategyLiveStatus.ACTIVE,
          index,
        )}
        filter={isRetired ? 'opacity(0.5)' : 'none'}
        borderRadius="lg"
        padding="18px 18px 14px 18px"
        marginBottom={'10px'}
        width="100%"
        position="relative"
      >
        {/* Top row: Avatars, name, shield, New badge */}
        <Flex align="center" justify="space-between" width="100%">
          <StrategyInfo
            pool={pool}
            index={index}
            showProtocolName={props.showProtocolName}
          />
        </Flex>

        {/* APY, TVL, Risk row */}
        <Flex mt={3} width="100%" align="flex-end" justify="space-between">
          <Box>
            <Text color="text_secondary" fontWeight="600" fontSize="15px">
              APY
            </Text>
            <Text color="text_primary" fontWeight="bold" fontSize="18px" mt={1}>
              {(pool.apr * 100).toFixed(2)}%
            </Text>
          </Box>
          <Box>
            <Text color="text_secondary" fontWeight="600" fontSize="15px">
              TVL
            </Text>
            <Text color="text_primary" fontWeight="bold" fontSize="18px" mt={1}>
              {`$${getDisplayCurrencyAmount(pool.tvl, 0)}`}
            </Text>
          </Box>
          <Box textAlign="right">
            <Text color="text_secondary" fontWeight="600" fontSize="15px">
              Risk
            </Text>
            <HStack mt={1} spacing={1} justify="flex-end">
              {GetRiskLevel(pool.additional?.riskFactor)}
            </HStack>
          </Box>
        </Flex>
      </Box>
    </Link>
  );
}

export function getLinkProps(pool: PoolInfo, showProtocolName?: boolean) {
  return {
    href: pool.protocol.link,
    // target: isMobile ? '_self' : '_blank',
    onClick: () => {
      mixpanel.track('Pool clicked', {
        pool: pool.pool.name,
        protocol: pool.protocol.name,
        yield: pool.apr,
        risk: pool.additional.riskFactor,
        tvl: pool.tvl,
        showProtocolName,
      });
    },
  };
}
export default function YieldCard(props: YieldCardProps) {
  const { pool, index } = props;
  const address = useAtomValue(addressAtom);

  const showBalance = useMemo(() => {
    return props.showBalance && address != undefined;
  }, [props.showBalance, address]);

  const isRetired = useMemo(() => {
    return isPoolRetired(pool);
  }, [pool]);

  return (
    <>
      <Tr
        className="faded-purple-gradient"
        color={'white'}
        display={{ base: 'none', md: 'table-row' }}
        filter={isRetired ? 'opacity(0.7)' : 'none'}
        _hover={{
          bg: 'mycard_light',
        }}
        padding={'1.5rem'}
        borderRadius={'lg'}
      >
        <Td width={'40%'} borderLeftRadius={'lg'}>
          <a {...getLinkProps(pool, props.showProtocolName)}>
            <StrategyInfo
              pool={pool}
              index={index}
              showProtocolName={props.showProtocolName}
            />
          </a>
        </Td>
        <Td width={'15%'}>
          {isRetired ? (
            <Text ml="auto" w="fit-content" mr="2">
              -
            </Text>
          ) : (
            <StrategyAPY pool={pool} index={index} />
          )}
        </Td>
        <Td width={'15%'}>
          {isRetired ? (
            <Text ml="auto" w="100%" mr="2" textAlign={'center'}>
              -
            </Text>
          ) : pool.additional?.riskFactor ? (
            <Box width={'100%'}>
              {GetRiskLevel(pool.additional?.riskFactor)}
            </Box>
          ) : (
            '-'
          )}
        </Td>
        <Td width={'15%'} borderRightRadius={showBalance ? 'none' : 'lg'}>
          {isRetired ? (
            <Text ml="auto" w="fit-content" mr="2">
              -
            </Text>
          ) : (
            <StrategyTVL pool={pool} index={index} />
          )}
        </Td>
        {showBalance && (
          <Td width={'15%'} borderRightRadius={'lg'}>
            {isRetired ? (
              <Text ml="auto" w="fit-content" mr="2">
                -
              </Text>
            ) : (
              <StrategyBalance pool={pool} index={index} />
            )}
          </Td>
        )}
      </Tr>
      <StrategyMobileCard
        pool={pool}
        index={index}
        showProtocolName={props.showProtocolName}
      />
    </>
  );
}

export function YieldStrategyCard(props: {
  strat: TrovesStrategyAPIResult;
  index: number;
}) {
  const strat = getPoolInfoFromStrategy(props.strat);
  return (
    <YieldCard
      pool={strat}
      index={props.index}
      showProtocolName={true}
      showBalance={true}
    />
  );
}

export function HeaderSorter(props: {
  heading: string;
  align: 'left' | 'right';
  mainColor: string;
  inActiveColor: string;
  onClick: (order: 'asc' | 'desc') => void;
  // added active? boolean to handle sort status...
  active?: boolean;
}) {
  // get the current sort atom
  const sort = useAtomValue(sortAtom);
  // get corrent index for a particular sort option from the current sort atom
  const currentFieldIndex = sort.findIndex(
    (s) => s.field === sortHeading(props.heading),
  );
  // get the order of the clicked sort option
  const order: 'asc' | 'desc' =
    currentFieldIndex >= 0 ? sort[currentFieldIndex].order : 'desc';
  return (
    <HStack
      as="button"
      onClick={() => {
        props.onClick(order);
      }}
      float={props.align}
      padding={0}
    >
      <Text color={props.mainColor}>{props.heading.toUpperCase()}</Text>
      <HStack gap={0} spacing={0}>
        <ArrowUpIcon
          color={
            order == 'asc' && props.active
              ? props.mainColor
              : props.inActiveColor
          }
          height={'12px'}
          width={'12px'}
          marginTop={'-2px'}
        />
        <ArrowDownIcon
          color={
            order == 'desc' && props.active
              ? props.mainColor
              : props.inActiveColor
          }
          height={'12px'}
          width={'12px'}
          marginBottom={'-2px'}
        />
      </HStack>
    </HStack>
  );
}
