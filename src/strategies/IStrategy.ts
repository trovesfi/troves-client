import { IDapp } from '@/store/IDapp.store';
import {
  BalanceResult,
  getBalanceAtom,
  returnEmptyBal,
} from '@/store/balance.atoms';
import { IndexedPoolData } from '@/store/endur.store';
import { LendingSpace } from '@/store/lending.base';
import { Category, PoolInfo } from '@/store/pools';
import { zkLend } from '@/store/zklend.store';
import {
  convertToV2TokenInfo,
  convertToV2Web3Number,
  getPrice,
  MyTokenInfo,
  MyWeb3Number,
} from '@/utils';
import MyNumber from '@/utils/MyNumber';
import {
  IInvestmentFlow,
  IStrategyMetadata,
  SingleActionAmount,
  TokenInfo as TokenInfoV2,
  Web3Number,
} from '@strkfarm/sdk';
import { Atom, atom } from 'jotai';
import { AtomWithQueryResult, atomWithQuery } from 'jotai-tanstack-query';
import { ReactNode } from 'react';
import { Call, ProviderInterface } from 'starknet';

export interface Step {
  name: string;
  optimizer: (
    pools: PoolInfo[],
    amount: string,
    prevActions: StrategyAction[],
  ) => StrategyAction[];
  filter: ((
    pools: PoolInfo[],
    amount: string,
    prevActions: StrategyAction[],
  ) => PoolInfo[])[];
}

export interface TokenInfo {
  token: string;
  decimals: number;
  displayDecimals: number;
  address?: string;
  name: string;
  logo: any;
  minAmount: MyNumber;
  maxAmount: MyNumber;
  stepAmount: MyNumber;
  ekuboPriceKey?: string;
  isERC4626: boolean;
}

export interface NFTInfo {
  name: string;
  address: string;
  logo: any;
  config: {
    mainTokenName: string;
  };
}

export interface StrategyAction {
  pool: PoolInfo;
  amount: string;
  isDeposit: boolean;
  name?: string;
}

export enum StrategyStatus {
  UNINTIALISED = 0,
  SOLVING = 1,
  SOLVED = 2,
}

export enum StrategyLiveStatus {
  ACTIVE = 'Active',
  NEW = 'New',
  COMING_SOON = 'Coming Soon',
  RETIRED = 'Retired',
  HOT = 'Hot & New 🔥',
}

export type onStratAmountsChangeFn = (
  change: {
    amountInfo: SingleActionAmount;
    index: number;
  },
  allAmounts: SingleActionAmount[],
) => Promise<SingleActionAmount[]>;

export interface IStrategyActionHook {
  calls: Call[];
  amounts: {
    tokenInfo: TokenInfoV2;
    balanceAtom: Atom<AtomWithQueryResult<BalanceResult, Error>>;
  }[];

  // if strategy wants to relate different input amounts,
  // config this fn
  onAmountsChange?: onStratAmountsChangeFn;
}

export interface IStrategySettings {
  maxTVL: number;
  alerts?: {
    type: 'warning' | 'info';
    text: string | ReactNode;
    tab: 'all' | 'deposit' | 'withdraw';
  }[];
  hideHarvestInfo?: boolean;
  is_promoted?: boolean;
  isAudited?: boolean;
  auditUrl?: string;
  isPaused?: boolean;
  isInMaintenance?: boolean;
  quoteToken: TokenInfoV2; // used to show the holdings in this token,
  isTransactionHistDisabled?: boolean;
}

export interface APYHistoryBlockInfo {
  block: number;
  timestamp: number;
}

export interface APYHistory {
  block: number;
  timestamp: number;
  apy: number;
}

export interface AmountInfo {
  amount: Web3Number;
  usdValue: number;
  tokenInfo: TokenInfoV2;
}

export interface AmountsInfo {
  usdValue: number;
  amounts: AmountInfo[];
}

export interface DepositActionInputs {
  amount: MyNumber;
  amount2?: MyNumber; // used in dual token deposits
  address: string;
  provider: ProviderInterface;
  isMax: boolean;
}

export function isLive(status: StrategyLiveStatus) {
  return (
    status == StrategyLiveStatus.ACTIVE ||
    status == StrategyLiveStatus.HOT ||
    status == StrategyLiveStatus.NEW
  );
}

export interface WithdrawActionInputs extends DepositActionInputs {}

export class IStrategyProps<T> {
  readonly liveStatus: StrategyLiveStatus;
  readonly id: string;
  readonly name: string;
  readonly description: string | ReactNode;
  readonly settings: IStrategySettings;
  readonly metadata: IStrategyMetadata<T>;
  exchanges: IDapp<any>[] = [];

  // @deprecated Not used in new strats. instead use investmentFlows
  steps: Step[] = [];
  investmentFlows: IInvestmentFlow[] = [];

  actions: StrategyAction[] = [];
  netYield: number = 0;
  leverage: number = 0;
  fee_factor = 0; // in absolute terms, not %
  status = StrategyStatus.UNINTIALISED;
  isSingleTokenDepositView = true;

  readonly rewardTokens: { logo: string }[];
  readonly holdingTokens: (TokenInfo | NFTInfo)[];

  balEnabled = atom(false);
  // summary of balance in some quote token
  // as required by the strategy
  balanceSummaryAtom: Atom<AtomWithQueryResult<BalanceResult, Error>>;
  // a strategy can have multiple balance tokens, this is for that
  balanceAtoms: Atom<AtomWithQueryResult<BalanceResult, Error>>[] = [];
  balancesAtom: Atom<BalanceResult[]>;
  readonly tvlAtom: Atom<AtomWithQueryResult<AmountsInfo, Error>>;

  riskFactor: number = 5;
  risks: string[] = [
    'The strategy involves exposure to smart contracts, which inherently carry risks like hacks, albeit relatively low',
    'APYs shown are just indicative and do not promise exact returns',
  ];

  getSafetyFactorLine() {
    return `Risk factor: ${this.riskFactor}/5`;
  }

  depositMethods = async (
    inputs: DepositActionInputs,
  ): Promise<IStrategyActionHook[]> => {
    return [];
  };

  withdrawMethods = async (
    inputs: WithdrawActionInputs,
  ): Promise<IStrategyActionHook[]> => {
    return [];
  };

  getTVL = async (): Promise<AmountsInfo> => {
    throw new Error('getTVL: Not implemented');
  };

  getUserTVL = async (user: string): Promise<AmountsInfo> => {
    throw new Error('getTVL: Not implemented');
  };

  getAPYHistory = async (
    blocks: APYHistoryBlockInfo[],
  ): Promise<APYHistory[]> => {
    return [];
  };

  isLive() {
    return isLive(this.liveStatus);
  }

  isRetired() {
    return this.liveStatus == StrategyLiveStatus.RETIRED;
  }

  constructor(
    id: string,
    name: string,
    description: string | ReactNode,
    rewardTokens: { logo: string }[],
    holdingTokens: (TokenInfo | NFTInfo)[],
    liveStatus: StrategyLiveStatus,
    settings: IStrategySettings,
    metadata: IStrategyMetadata<T>,
    balanceAtom?: Atom<AtomWithQueryResult<BalanceResult, Error>>,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.rewardTokens = rewardTokens;
    this.holdingTokens = holdingTokens;
    this.balanceSummaryAtom =
      balanceAtom || getBalanceAtom(holdingTokens[0], this.balEnabled);
    this.liveStatus = liveStatus;
    this.settings = settings;
    this.metadata = metadata;
    this.tvlAtom = atomWithQuery((get) => {
      return {
        queryKey: ['tvl', this.id],
        queryFn: async ({ queryKey }: any): Promise<AmountsInfo> => {
          return this.getTVL();
        },
        refetchInterval: 15000,
      };
    });
    this.balancesAtom = this.getBalancesAtom();
  }

  getBalancesAtom() {
    return atom((get) => {
      return this.balanceAtoms.map((atom) => {
        const res = get(atom);
        if (!res.data) {
          return returnEmptyBal();
        }
        return res.data;
      });
    });
  }

  async computeSummaryValue(
    amounts: SingleActionAmount[],
    quoteToken: MyTokenInfo,
    source: string,
  ): Promise<MyWeb3Number> {
    const valuesProm = amounts.map((amount) => {
      return this.getValueInQuoteToken(
        convertToV2Web3Number(amount.amount),
        convertToV2TokenInfo(amount.tokenInfo),
        quoteToken,
        source,
      );
    });
    const values = await Promise.all(valuesProm);
    const total = values.reduce(
      (acc, amount) => {
        return acc.plus(amount);
      },
      Web3Number.fromWei('0', quoteToken.decimals),
    );
    return total;
  }

  async getValueInQuoteToken(
    amount: MyWeb3Number,
    tokenInfo: MyTokenInfo,
    quoteToken: MyTokenInfo,
    source: string,
  ): Promise<MyWeb3Number> {
    if (tokenInfo.address.eq(quoteToken.address)) {
      return amount;
    }

    const price = await getPrice(
      tokenInfo,
      `getValueInQuoteToken::1::${source}`,
    );
    const priceQuote = await getPrice(
      quoteToken,
      `getValueInQuoteToken::2::${source}`,
    );

    const amt = amount.multipliedBy(price).dividedBy(priceQuote);

    // adjust decimals
    const decimals = tokenInfo.decimals;
    const quoteDecimals = quoteToken.decimals;
    if (decimals > quoteDecimals) {
      return amt.dividedBy(10 ** (decimals - quoteDecimals));
    }
    if (decimals < quoteDecimals) {
      return amt.multipliedBy(10 ** (quoteDecimals - decimals));
    }
    return amt;
  }
}

export class IStrategy<T> extends IStrategyProps<T> {
  readonly tag: string;

  constructor(
    id: string,
    tag: string,
    name: string,
    description: string | ReactNode,
    rewardTokens: { logo: string }[],
    holdingTokens: (TokenInfo | NFTInfo)[],
    liveStatus = StrategyLiveStatus.ACTIVE,
    settings: IStrategySettings,
    metadata: IStrategyMetadata<T>,
    balanceAtom?: Atom<AtomWithQueryResult<BalanceResult, Error>>,
  ) {
    super(
      id,
      name,
      description,
      rewardTokens,
      holdingTokens,
      liveStatus,
      settings,
      metadata,
      balanceAtom,
    );
    this.tag = tag;
  }

  filterStablesOnly(
    pools: PoolInfo[],
    amount: string,
    prevActions: StrategyAction[],
  ) {
    const eligiblePools = pools.filter((p) =>
      p.category.includes(Category.Stable),
    );
    if (!eligiblePools) throw new Error(`${this.tag}: [F1] no eligible pools`);
    return eligiblePools;
  }

  filterSameProtocolNotSameDepositPool(
    pools: PoolInfo[],
    amount: string,
    prevActions: StrategyAction[],
  ) {
    if (prevActions.length == 0)
      throw new Error(
        `${this.tag}: filterSameProtocolNotSameDepositPool - Prev actions zero`,
      );
    const lastAction = prevActions[prevActions.length - 1];
    const eligiblePools = pools
      .filter((p) => p.protocol.name == lastAction.pool.protocol.name)
      .filter((p) => {
        return p.pool.name != lastAction.pool.pool.name;
      });

    if (!eligiblePools) throw new Error(`${this.tag}: [F2] no eligible pools`);
    return eligiblePools;
  }

  filterNotSameProtocolSameDepositPool(
    pools: PoolInfo[],
    amount: string,
    prevActions: StrategyAction[],
  ) {
    if (prevActions.length == 0)
      throw new Error(
        `${this.tag}: filterNotSameProtocolSameDepositPool - Prev actions zero`,
      );
    const lastAction = prevActions[prevActions.length - 1];
    const eligiblePools = pools
      .filter((p) => p.protocol.name != lastAction.pool.protocol.name)
      .filter((p) => {
        return p.pool.name == lastAction.pool.pool.name;
      });

    if (!eligiblePools) throw new Error(`${this.tag}: [F3] no eligible pools`);
    return eligiblePools;
  }

  filterTokenByProtocol(
    tokenName: string,
    protocol:
      | IDapp<LendingSpace.MyBaseAprDoc[]>
      | IDapp<IndexedPoolData> = zkLend,
  ) {
    return (
      pools: PoolInfo[],
      amount: string,
      prevActions: StrategyAction[],
    ) => {
      return pools.filter(
        (p) => p.pool.name == tokenName && p.protocol.name == protocol.name,
      );
    };
  }

  optimizerDeposit(
    eligiblePools: PoolInfo[],
    amount: string,
    actions: StrategyAction[],
  ) {
    let bestPool: PoolInfo = eligiblePools[0];
    eligiblePools.forEach((p) => {
      if (p.apr > bestPool.apr) {
        bestPool = p;
      }
    });
    return [...actions, { pool: bestPool, amount, isDeposit: true }];
  }

  async solve(pools: PoolInfo[], amount: string) {
    this.actions = [];
    let _amount: string = amount;
    let netYield = 0;
    this.status = StrategyStatus.SOLVING;
    try {
      for (let i = 0; i < this.steps.length; ++i) {
        const step = this.steps[i];
        let _pools = [...pools];
        for (let j = 0; j < step.filter.length; ++j) {
          const filter = step.filter[j];
          _pools = filter.bind(this)(_pools, amount, this.actions);
        }

        console.log(
          'solve',
          {
            i,
            poolsLen: pools.length,
            _amount,
          },
          this.actions,
          _pools,
        );

        if (_pools.length > 0) {
          console.log('solving', step.name);
          this.actions = step.optimizer.bind(this)(
            _pools,
            _amount,
            this.actions,
          );
          if (this.actions.length != i + 1) {
            console.warn(`actions`, this.actions.length, 'i', i);
            throw new Error('one new action per step required');
          }
          this.actions[i].name = step.name;
          _amount = this.actions[this.actions.length - 1].amount;
        } else {
          throw new Error('no pools to continue computing strategy');
        }
      }
    } catch (err) {
      console.warn(`${this.tag} - unsolved`, err);
      return;
    }

    console.log('Completed solving actions', this.actions.length);
    this.actions.forEach((action) => {
      const sign = action.isDeposit ? 1 : -1;
      const apr = action.isDeposit ? action.pool.apr : action.pool.borrow.apr;
      netYield += sign * apr * Number(action.amount);
      console.log('netYield1', sign, apr, action.amount, netYield);
    });
    this.netYield = netYield / Number(amount);
    console.log('netYield2', netYield, this.netYield, Number(amount));
    this.leverage = this.netYield / this.actions[0].pool.apr;

    this.postSolve();

    this.status = StrategyStatus.SOLVED;
  }

  postSolve() {}

  isSolved() {
    return this.status === StrategyStatus.SOLVED;
  }

  isSolving() {
    return this.status === StrategyStatus.SOLVING;
  }
}

export function getLiveStatusEnum(status: number) {
  if (status == 1) {
    return StrategyLiveStatus.HOT;
  }
  if (status == 2) {
    return StrategyLiveStatus.NEW;
  } else if (status == 3) {
    return StrategyLiveStatus.ACTIVE;
  } else if (status == 4) {
    return StrategyLiveStatus.COMING_SOON;
  }
  return StrategyLiveStatus.RETIRED;
}

export const getRiskString = (riskValue: number): string => {
  if (riskValue === 0) {
    return 'No risk';
  } else if (riskValue <= 1) {
    return 'Very Low';
  } else if (riskValue <= 2) {
    return 'Low';
  } else if (riskValue < 3) {
    return 'Medium';
  }
  return 'High';
};
