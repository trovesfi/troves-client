import { atom } from 'jotai';
import {
  IStrategy,
  IStrategyProps,
  StrategyLiveStatus,
} from '@/strategies/IStrategy';
import CONSTANTS from '@/constants';
import Mustache from 'mustache';
import { getTokenInfoFromName } from '@/utils';
import { allPoolsAtomUnSorted, privatePoolsAtom } from './protocols';
import EndurAtoms, { endur } from './endur.store';
import { getDefaultPoolInfo, PoolInfo } from './pools';
import { AutoTokenStrategy } from '@/strategies/auto_strk.strat';
import { DeltaNeutralMM } from '@/strategies/delta_neutral_mm';
import { DeltaNeutralMM2 } from '@/strategies/delta_neutral_mm_2';
import { DeltaNeutralMMVesuEndur } from '@/strategies/delta_neutral_mm_vesu_endur';

export interface StrategyInfo extends IStrategyProps {
  name: string;
}

export function getStrategies() {
  const autoStrkStrategy = new AutoTokenStrategy(
    'STRK',
    'Auto Compounding STRK',
    "Stake your STRK or zkLend's zSTRK token to receive DeFi Spring $STRK rewards every 7 days. The strategy auto-collects your rewards and re-invests them in the zkLend STRK pool, giving you higher return through compounding. You receive frmzSTRK LP token as representation for your stake on STRKFarm. You can withdraw anytime by redeeming your frmzSTRK for zSTRK and see your STRK in zkLend.",
    'zSTRK',
    CONSTANTS.CONTRACTS.AutoStrkFarm,
    {
      maxTVL: 2000000,
      isAudited: true,
    },
  );
  const autoUSDCStrategy = new AutoTokenStrategy(
    'USDC',
    'Auto Compounding USDC',
    "Stake your USDC or zkLend's zUSDC token to receive DeFi Spring $STRK rewards every 7 days. The strategy auto-collects your $STRK rewards, swaps them to USDC and re-invests them in the zkLend USDC pool, giving you higher return through compounding. You receive frmzUSDC LP token as representation for your stake on STRKFarm. You can withdraw anytime by redeeming your frmzUSDC for zUSDC and see your STRK in zkLend.",
    'zUSDC',
    CONSTANTS.CONTRACTS.AutoUsdcFarm,
    {
      maxTVL: 2000000,
      isAudited: true,
    },
  );

  const alerts: any[] = [
    {
      type: 'warning',
      text: 'Deposits may fail due to debt limit on zkLend. We are working with them to increase the limit. Please check back later.',
    },
  ];

  const DNMMDescription = `Deposit your {{token1}} to automatically loop your funds between zkLend and Nostra to create a delta neutral position. This strategy is designed to maximize your yield on {{token1}}. Your position is automatically adjusted periodically to maintain a healthy health factor. You receive a NFT as representation for your stake on STRKFarm. You can withdraw anytime by redeeming your NFT for {{token1}}.`;
  const usdcTokenInfo = getTokenInfoFromName('USDC');
  const deltaNeutralMMUSDCETH = new DeltaNeutralMM(
    usdcTokenInfo,
    'USDC Sensei',
    Mustache.render(DNMMDescription, { token1: 'USDC', token2: 'ETH' }),
    'ETH',
    CONSTANTS.CONTRACTS.DeltaNeutralMMUSDCETH,
    [1, 0.615384615, 1, 0.584615385, 0.552509024], // precomputed factors based on strategy math
    StrategyLiveStatus.NEW,
    {
      maxTVL: 1500000,
      isAudited: true,
      // alerts,
    },
  );

  const deltaNeutralMMETHUSDC = new DeltaNeutralMM(
    getTokenInfoFromName('ETH'),
    'ETH Sensei',
    Mustache.render(DNMMDescription, { token1: 'ETH', token2: 'USDC' }),
    'USDC',
    CONSTANTS.CONTRACTS.DeltaNeutralMMETHUSDC,
    [1, 0.609886, 1, 0.920975, 0.510078], // precomputed factors based on strategy math
    StrategyLiveStatus.ACTIVE,
    {
      maxTVL: 1000,
      alerts: [
        {
          type: 'info',
          text: 'Pro tip: Try to split your deposit between this strategy and ETH Sensei XL to avoid impact of yield fluctuations',
          tab: 'deposit',
        },
      ],
      isAudited: true,
    },
  );
  const deltaNeutralMMSTRKETH = new DeltaNeutralMM(
    getTokenInfoFromName('STRK'),
    'STRK Sensei',
    Mustache.render(DNMMDescription, { token1: 'STRK', token2: 'ETH' }),
    'ETH',
    CONSTANTS.CONTRACTS.DeltaNeutralMMSTRKETH,
    [1, 0.384615, 1, 0.492308, 0.233276], // precomputed factors based on strategy math, last is the excess deposit1 that is happening
    StrategyLiveStatus.NEW,
    {
      maxTVL: 1500000,
      isAudited: true,
      // alerts,
    },
  );

  const deltaNeutralMMETHUSDCReverse = new DeltaNeutralMM2(
    getTokenInfoFromName('ETH'),
    'ETH Sensei XL',
    Mustache.render(DNMMDescription, { token1: 'ETH', token2: 'USDC' }),
    'USDC',
    CONSTANTS.CONTRACTS.DeltaNeutralMMETHUSDCXL,
    [1, 0.5846153846, 1, 0.920975, 0.552509], // precomputed factors based on strategy math
    StrategyLiveStatus.NEW,
    {
      maxTVL: 2000,
      alerts: [
        {
          type: 'info',
          text: 'Pro tip: Try to split your deposit between this strategy and ETH Sensei to avoid impact of yield fluctuations',
          tab: 'deposit',
        },
      ],
      isAudited: false,
    },
  );

  const xSTRKDescription = `Deposit your {{token1}} to automatically loop your funds via Endur and Vesu to create a delta neutral position. This strategy is designed to maximize your yield on {{token1}}. Your position is automatically adjusted periodically to maintain a healthy health factor. You receive a NFT as representation for your stake on STRKFarm. You can withdraw anytime by redeeming your NFT for {{token2}}.`;
  const deltaNeutralxSTRKSTRK = new DeltaNeutralMMVesuEndur(
    getTokenInfoFromName('STRK'),
    'xSTRK Sensei',
    Mustache.render(xSTRKDescription, { token1: 'STRK', token2: 'xSTRK' }),
    'xSTRK',
    CONSTANTS.CONTRACTS.DeltaNeutralxSTRKSTRKXL,
    [1, 1, 0.725, 1.967985], // precomputed factors based on strategy math
    StrategyLiveStatus.HOT,
    {
      maxTVL: 1000000,
      alerts: [
        {
          type: 'info',
          text: 'Note: On withdrawal, you will receive xSTRK. You can use xSTRK as STRK for most use-cases, however, you can redeem it for STRK anytime on endur.fi',
          tab: 'withdraw',
        },
      ],
      isAudited: false,
    },
  );

  // const xSTRKStrategy = new AutoXSTRKStrategy(
  //   'Stake STRK',
  //   'Endur is Starknet’s dedicated staking platform, where you can stake STRK to earn staking rewards. This strategy, built on Endur, is an incentivized vault that boosts returns by offering additional rewards. In the future, it may transition to auto-compounding on DeFi Spring, reinvesting rewards for maximum growth. Changes will be announced at least three days in advance on our socials.',
  //   CONSTANTS.CONTRACTS.AutoxSTRKFarm,
  //   {
  //     maxTVL: 2000000,
  //     alerts: [],
  //     is_promoted: true,
  //   },
  // );

  const strategies: IStrategy[] = [
    autoStrkStrategy,
    autoUSDCStrategy,
    deltaNeutralMMUSDCETH,
    deltaNeutralMMETHUSDC,
    deltaNeutralMMSTRKETH,
    deltaNeutralMMETHUSDCReverse,
    deltaNeutralxSTRKSTRK,
    // xSTRKStrategy,
  ];

  return strategies;
}

export const STRATEGIES_INFO = getStrategies();

export const getPrivatePools = (get: any) => {
  // A placeholder to fetch any external pools/rewards info
  // that is not necessarily available in the allPools (i.e. not public)
  const endurRewardInfo = get(EndurAtoms.rewardInfo);
  const endurRewardPoolInfo = getDefaultPoolInfo();
  endurRewardPoolInfo.pool.id = 'endur_strk_reward';
  endurRewardPoolInfo.protocol.name = endur.name;
  endurRewardPoolInfo.protocol.link = endur.link;
  endurRewardPoolInfo.protocol.logo = endur.logo;
  endurRewardPoolInfo.pool.name = 'STRK';
  endurRewardPoolInfo.pool.logos = [getTokenInfoFromName('STRK').logo];
  endurRewardPoolInfo.apr = endurRewardInfo.data || 0;

  return [endurRewardPoolInfo];
};

export const strategiesAtom = atom<StrategyInfo[]>((get) => {
  const strategies = getStrategies();
  const allPools = get(allPoolsAtomUnSorted);
  const requiredPools = allPools.filter(
    (p) =>
      p.protocol.name === 'zkLend' ||
      p.protocol.name === 'Nostra' ||
      p.protocol.name === 'Vesu' ||
      p.protocol.name === endur.name,
  );

  const privatePools: PoolInfo[] = get(privatePoolsAtom);
  for (const s of strategies) {
    s.solve([...requiredPools, ...privatePools], '1000');
  }

  strategies.sort((a, b) => {
    const status1 = getLiveStatusNumber(a.liveStatus);
    const status2 = getLiveStatusNumber(b.liveStatus);
    return status1 - status2 || b.netYield - a.netYield;
  });
  return strategies;
});

export function getLiveStatusNumber(status: StrategyLiveStatus) {
  if (status == StrategyLiveStatus.NEW) {
    return 1;
  } else if (status == StrategyLiveStatus.ACTIVE) {
    return 2;
  } else if (status == StrategyLiveStatus.COMING_SOON) {
    return 3;
  } else if (status == StrategyLiveStatus.HOT) {
    return 5;
  }
  return 4;
}

export function getLiveStatusEnum(status: number) {
  if (status == 1) {
    return StrategyLiveStatus.NEW;
  } else if (status == 2) {
    return StrategyLiveStatus.ACTIVE;
  } else if (status == 3) {
    return StrategyLiveStatus.COMING_SOON;
  } else if (status == 5) {
    return StrategyLiveStatus.HOT;
  }
  return StrategyLiveStatus.RETIRED;
}
