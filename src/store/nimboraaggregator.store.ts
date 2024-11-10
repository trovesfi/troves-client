import CONSTANTS from '@/constants';
import { Category, PoolType } from './pools';
import { atom } from 'jotai';
import { PoolInfo, ProtocolAtoms } from './pools';
import { atomWithQuery } from 'jotai-tanstack-query';
import { StrategyLiveStatus } from '@/strategies/IStrategy';
import fetchWithRetry from '@/utils/fetchWithRetry';
import { IDapp } from './IDapp.store';

interface NimboraAggregatorDoc {
  name: string;
  symbol: string;
  protocols: string[];
  points: [
    {
      protocol: string;
      multiplier: string;
      description: string;
    },
  ];
  description: string;
  vault: string;
  underlying: string;
  underlyingSymbol: string;
  underlyingPrice: string;
  decimals: string;
  tvl: string;
  aprBreakdown: {
    base: string;
    boost: string;
    incentives: string;
  };
  apr: string;
  shareRatio: string;
  remainingDepositAvailable: string;
  totalAssets: string;
  limit: string;
  performanceFee: string;
}

export class NimboraAggregator extends IDapp<NimboraAggregatorDoc> {
  name = 'Nimbora';
  link = 'https://app.nimbora.io/';
  logo =
    'https://assets-global.website-files.com/64f0518cbb38bb59ddd7a331/64f1ea84a753c1ed93b2c920_faviconn.png';

  incentiveDataKey = 'isNimboraAggregator';

  _computePoolsInfo(data: any) {
    try {
      if (!data) return [];
      const pools: PoolInfo[] = [];

      Object.keys(data)
        .filter(this.commonVaultFilter)
        .forEach((poolName) => {
          const poolData: NimboraAggregatorDoc = data[poolName];
          let category = Category.Others;
          const riskFactor = 3;
          if (poolName === 'STRK') {
            category = Category.STRK;
          }

          const logo =
            CONSTANTS.LOGOS[poolName as keyof typeof CONSTANTS.LOGOS];

          const baseApr = Number(poolData.aprBreakdown.base) / 100;
          const boostApr = Number(poolData.aprBreakdown.boost) / 100;
          const rewardApr = Number(poolData.aprBreakdown.incentives) / 100;

          const apr = baseApr + boostApr + rewardApr;

          const poolInfo: PoolInfo = {
            pool: {
              id: this.getPoolId(this.name, poolName),
              name: `Earn ${poolName} with ${poolData.symbol}`,
              logos: [logo],
            },
            protocol: {
              name: this.name,
              link: this.link,
              logo: this.logo,
            },
            apr: apr ?? 0,
            tvl: Number(poolData.tvl),
            aprSplits: [
              {
                apr: baseApr ?? 0,
                title: 'Base APR',
                description: '',
              },
              {
                apr: boostApr ?? 0,
                title: 'Boost',
                description: '',
              },
              {
                apr: rewardApr ?? 0,
                title: 'STRK DeFi Spring rewards',
                description: '',
              },
            ],
            category,
            type: PoolType.DEXV2,
            lending: {
              collateralFactor: 0,
            },
            borrow: {
              borrowFactor: 0,
              apr: 0,
            },
            additional: {
              tags: [StrategyLiveStatus.ACTIVE],
              riskFactor,
              isAudited: false, // TODO: Update this
            },
          };
          pools.push(poolInfo);
        });

      return pools;
    } catch (err) {
      console.error('Error fetching pools', err);
      throw err;
    }
  }

  commonVaultFilter(poolName: string) {
    const supportedPools = ['STRK'];
    return supportedPools.includes(poolName);
  }
}

export const nimboraAggregator = new NimboraAggregator();

export const NimboraAggregatorAtom = atomWithQuery((get) => ({
  queryKey: ['isNimboraAggregator'],
  queryFn: async ({ queryKey }) => {
    const fetchPools = async (): Promise<NimboraAggregatorDoc[]> => {
      const res = await fetchWithRetry(
        CONSTANTS.NIMBORA.AGGREGATOR_APR_API,
        {},
        'Failed to fetch Nimbora Aggregator data',
      );

      if (!res) {
        return [];
      }
      let data = await res.text();
      data = data.replaceAll('NaN', '0');
      return JSON.parse(data);
    };

    const pools = await fetchPools();
    return pools.reduce<{ [key: string]: NimboraAggregatorDoc }>(
      (acc, pool) => {
        acc[pool.underlyingSymbol] = pool;
        return acc;
      },
      {},
    );
  },
}));

const NimboraAggregatorAtoms: ProtocolAtoms = {
  pools: atom((get) => {
    const poolsInfo = get(NimboraAggregatorAtom);
    return poolsInfo.data
      ? nimboraAggregator._computePoolsInfo(poolsInfo.data)
      : [];
  }),
};

export default NimboraAggregatorAtoms;
