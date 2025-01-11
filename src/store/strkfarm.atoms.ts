import CONSTANTS from '@/constants';
import {
  APRSplit,
  Category,
  getCategoriesFromName,
  PoolInfo,
  PoolMetadata,
  PoolType,
  ProtocolAtoms,
} from './pools';
import { atom } from 'jotai';
import { IDapp } from './IDapp.store';
import { AtomWithQueryResult, atomWithQuery } from 'jotai-tanstack-query';
import strkfarmLogo from '@public/logo.png';
import { getLiveStatusEnum } from './strategies.atoms';

export interface STRKFarmStrategyAPIResult {
  name: string;
  id: string;
  apy: number;
  depositToken: string[];
  leverage: number;
  contract: { name: string; address: string }[];
  tvlUsd: number;
  status: {
    number: number;
    value: string;
  };
  riskFactor: number;
  logo: string;
  isAudited: boolean;
  actions: {
    name: string;
    protocol: {
      name: string;
      logo: string;
    };
    token: {
      name: string;
      logo: string;
    };
    amount: string;
    isDeposit: boolean;
    apy: number;
  }[];
}

export class STRKFarm extends IDapp<STRKFarmStrategyAPIResult> {
  name = 'STRKFarm';
  logo = strkfarmLogo.src;
  incentiveDataKey = '';

  _computePoolsInfo(data: any) {
    const rawPools: STRKFarmStrategyAPIResult[] = data.strategies;
    const pools: PoolInfo[] = [];
    return rawPools.map((rawPool) => {
      const poolName = rawPool.name;
      const riskFactor = rawPool.riskFactor;

      const isStable = poolName.includes('USDC') || poolName.includes('USDT');
      const categories: Category[] = getCategoriesFromName(poolName, isStable);

      const poolInfo: PoolInfo = {
        pool: {
          id: rawPool.id,
          name: poolName,
          logos: [rawPool.logo],
        },
        protocol: {
          name: this.name,
          link: `/strategy/${rawPool.id}`,
          logo: this.logo,
        },
        apr: 0,
        tvl: rawPool.tvlUsd,
        aprSplits: [],
        category: categories,
        type: PoolType.Derivatives,
        lending: {
          collateralFactor: 0,
        },
        borrow: {
          borrowFactor: 0,
          apr: 0,
        },
        additional: {
          riskFactor,
          tags: [getLiveStatusEnum(rawPool.status.number)],
          isAudited: rawPool.isAudited,
          is_promoted: poolName.includes('Stake'),
        },
      };
      return poolInfo;
    });
  }

  getBaseAPY(p: PoolInfo, data: AtomWithQueryResult<any, Error>) {
    const aprData: STRKFarmStrategyAPIResult[] = data.data.strategies;
    let baseAPY: number | 'Err' = 'Err';
    let splitApr: APRSplit | null = null;
    const metadata: PoolMetadata | null = null;
    if (data.isSuccess) {
      const item = aprData.find((doc) => doc.id === p.pool.id);
      if (item) {
        baseAPY = item.apy;
        splitApr = {
          apr: baseAPY,
          title: 'Net APY',
          description: 'Includes fees & Defi spring rewards',
        };
      }
    }
    return {
      baseAPY,
      splitApr,
      metadata,
    };
  }
}

export const STRKFarmBaseAPYsAtom = atomWithQuery((get) => ({
  queryKey: ['strkfarm_base_aprs'],
  queryFn: async ({
    queryKey,
  }): Promise<{
    strategies: STRKFarmStrategyAPIResult[];
  }> => {
    const response = await fetch(`${CONSTANTS.STRKFarm.BASE_APR_API}`);
    const data = await response.json();
    return data;
  },
}));

export const strkfarm = new STRKFarm();
const STRKFarmAtoms: ProtocolAtoms = {
  baseAPRs: STRKFarmBaseAPYsAtom,
  pools: atom((get) => {
    const empty: PoolInfo[] = [];
    if (!STRKFarmAtoms.baseAPRs) return empty;
    const baseInfo = get(STRKFarmAtoms.baseAPRs);
    if (baseInfo.data) {
      const pools = strkfarm._computePoolsInfo(baseInfo.data);
      return strkfarm.addBaseAPYs(pools, baseInfo);
    }
    return empty;
  }),
};
export default STRKFarmAtoms;
