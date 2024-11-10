import CONSTANTS from '@/constants';
import { Category, PoolType } from './pools';
import { atom } from 'jotai';
import { PoolInfo, ProtocolAtoms } from './pools';
import { atomWithQuery } from 'jotai-tanstack-query';
import { StrategyLiveStatus } from '@/strategies/IStrategy';
import fetchWithRetry from '@/utils/fetchWithRetry';
import { IDapp } from './IDapp.store';

interface NimboraLiquityDoc {
  protocol: string;
  l2address: string;
  l1address: string;
  tags: string[];
  description: string;
  actions: string[];
  data: {
    lusdSupply: string;
    apr: number;
    troveTotalDebt: string;
    currentBatchNounce: string;
    lastHandledBatchNonce: string;
    numberOfUsersToCloseBatch: string;
    remainingGasFeeToCloseBatch: string;
    totalRequiredGasToCloseBatch: string;
    batchGasFeePerUser: string;
    isRedistributionLiquity: string;
    nonces: number[];
  };
  troveMetadata: {
    ethPrice: string;
    borrowFees: string;
    tcr: string;
    borrowRate: string;
  };
}

export class NimboraLiquity extends IDapp<NimboraLiquityDoc> {
  name = 'Nimbora';
  link = 'https://app.nimbora.io/';
  logo =
    'https://assets-global.website-files.com/64f0518cbb38bb59ddd7a331/64f1ea84a753c1ed93b2c920_faviconn.png';

  incentiveDataKey = 'isNimboraLiquity';

  _computePoolsInfo(data: any) {
    try {
      if (!data) return [];
      const pools: PoolInfo[] = [];

      Object.keys(data)
        .filter(this.commonVaultFilter)
        .forEach((poolName) => {
          const poolData: NimboraLiquityDoc = data[poolName];
          const category = Category.Others;
          const riskFactor = 3;

          const logo = CONSTANTS.LOGOS['ETH'];

          const baseApr = Number(poolData.data.apr) / 100;
          const collateralFactor = Number(poolData.troveMetadata.tcr) / 100;
          const tvl = Number(poolData.data.troveTotalDebt) * collateralFactor;

          const poolInfo: PoolInfo = {
            pool: {
              id: this.getPoolId(this.name, poolName),
              name: 'Borrow LUSD against ETH',
              logos: [logo],
            },
            protocol: {
              name: this.name,
              link: this.link,
              logo: this.logo,
            },
            apr: baseApr,
            tvl,
            aprSplits: [
              {
                apr: baseApr,
                title: 'Base APR',
                description: '',
              },
            ],
            category,
            type: PoolType.Lending,
            lending: {
              collateralFactor,
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
    const supportedPools = ['LUSD'];
    return supportedPools.includes(poolName);
  }
}

export const nimboraLiquity = new NimboraLiquity();

export const NimboraLiquityAtom = atomWithQuery((get) => ({
  queryKey: ['isNimboraLiquity'],
  queryFn: async ({ queryKey }) => {
    const fetchPools = async (): Promise<NimboraLiquityDoc[]> => {
      const res = await fetchWithRetry(
        CONSTANTS.NIMBORA.LIQUIDITY_APR_API,
        {},
        'Failed to fetch Nimbora Liquity data',
      );

      if (!res) {
        return [];
      }
      let data = await res.text();
      data = data.replaceAll('NaN', '0');
      return JSON.parse(data);
    };

    const pools = await fetchPools();
    return pools.reduce<{ [key: string]: NimboraLiquityDoc }>((acc, pool) => {
      acc['LUSD'] = pool;
      return acc;
    }, {});
  },
}));

const NimboraLiquityAtoms: ProtocolAtoms = {
  pools: atom((get) => {
    const poolsInfo = get(NimboraLiquityAtom);
    return poolsInfo.data
      ? nimboraLiquity._computePoolsInfo(poolsInfo.data)
      : [];
  }),
};

export default NimboraLiquityAtoms;
