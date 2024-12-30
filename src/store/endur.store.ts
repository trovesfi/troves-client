import { atom } from 'jotai';

import RewardsAbi from '@/abi/rewards.abi.json';

import CONSTANTS, { provider } from '@/constants';
import { AutoXSTRKStrategy } from '@/strategies/auto_xstrk.strat';
import { StrategyLiveStatus } from '@/strategies/IStrategy';
import { getTokenInfoFromName } from '@/utils';
import { customAtomWithFetch } from '@/utils/customAtomWithFetch';
import { customAtomWithQuery } from '@/utils/customAtomWithQuery';
import MyNumber from '@/utils/MyNumber';
import { Contract } from 'starknet';
import { IDapp } from './IDapp.store';
import { Category, PoolInfo, PoolType } from './pools';

interface PoolData {
  tvl: number;
  apr: {
    percentage: number;
    apr_cl: number;
    apr: number;
    incentive_apr: number;
  };
}

interface IndexedPoolData {
  [key: string]: PoolData[];
}

export class Endur extends IDapp<IndexedPoolData> {
  name = 'Endur';
  link = 'https://endur.fi/r/strkfarm';
  logo = 'https://endur.fi/favicon.ico';
  incentiveDataKey: string = 'Endur';
}

export const endur = new Endur();

const EndurAtoms = {
  endurStats: customAtomWithFetch({
    url: 'https://app.endur.fi/api/stats',
    queryKey: 'Endur_stats',
  }),
  rewardInfo: customAtomWithQuery({
    queryKey: 'Endur_reward',
    queryFn: async () => {
      const REWARDS_CONTRACT =
        '0x3065fe1dacfaa108a764a9db51d9a5d1cbe7e23a8a9c9e13f12c291da1c1dbb';
      const contract = new Contract(RewardsAbi, REWARDS_CONTRACT, provider);
      const data: any = await contract.call('get_config', []);

      const autoxSTRK = new AutoXSTRKStrategy(
        'autoxstrk',
        'autoxstrk',
        CONSTANTS.CONTRACTS.AutoxSTRKFarm,
        {
          maxTVL: 2000000,
        },
      );
      const STRK = getTokenInfoFromName('STRK');
      const rewardsPerSecond = new MyNumber(
        data.rewards_per_second.toString(),
        STRK.decimals,
      );
      const tvl = await autoxSTRK.getTVL();

      const apy =
        Number(
          rewardsPerSecond
            .operate('mul', 365 * 24 * 60 * 60)
            .toEtherToFixedDecimals(2),
        ) / Number(tvl.amount.toEtherToFixedDecimals(2));
      return apy;
    },
  }),
  pools: atom((get) => {
    const empty: PoolInfo[] = [];
    const stats = get(EndurAtoms.endurStats);
    if (stats.data) {
      const poolInfo: PoolInfo = {
        pool: {
          id: 'endur_strk',
          name: 'STRK',
          logos: [getTokenInfoFromName('STRK').logo],
        },
        protocol: {
          name: endur.name,
          link: endur.link,
          logo: endur.logo,
        },
        apr: stats.data.apy,
        tvl: stats.data.tvl,
        aprSplits: [
          {
            apr: stats.data.apy,
            title: 'Net Yield',
            description: 'Includes fees & Defi spring rewards',
          },
        ],
        category: Category.STRK,
        type: PoolType.Staking,
        additional: {
          riskFactor: 0.5,
          tags: [StrategyLiveStatus.HOT],
          isAudited: true,
        },
        borrow: {
          apr: 0,
          borrowFactor: 0,
        },
        lending: {
          collateralFactor: 0,
        },
      };
      return [poolInfo];
    }
    return empty;
  }),
};

export default EndurAtoms;
