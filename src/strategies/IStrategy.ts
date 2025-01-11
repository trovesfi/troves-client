import { IDapp } from '@/store/IDapp.store';
import { BalanceResult, getBalanceAtom } from '@/store/balance.atoms';
import { IndexedPoolData } from '@/store/endur.store';
import { LendingSpace } from '@/store/lending.base';
import { Category, PoolInfo } from '@/store/pools';
import { zkLend } from '@/store/zklend.store';
import MyNumber from '@/utils/MyNumber';
import { Atom, atom } from 'jotai';
import { AtomWithQueryResult, atomWithQuery } from 'jotai-tanstack-query';
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

export interface IStrategyActionHook {
  tokenInfo: TokenInfo;
  calls: Call[];
  balanceAtom: Atom<AtomWithQueryResult<BalanceResult, Error>>;
}

export interface IStrategySettings {
  maxTVL: number;
  alerts?: {
    type: 'warning' | 'info';
    text: string;
    tab: 'all' | 'deposit' | 'withdraw';
  }[];
  hideHarvestInfo?: boolean;
  is_promoted?: boolean;
  isAudited?: boolean;
}

export interface AmountInfo {
  amount: MyNumber;
  usdValue: number;
  tokenInfo: TokenInfo;
}

export interface DepositActionInputs {
  amount: MyNumber;
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

export class IStrategyProps {
  readonly liveStatus: StrategyLiveStatus;
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly settings: IStrategySettings;
  exchanges: IDapp<any>[] = [];

  steps: Step[] = [];

  actions: StrategyAction[] = [];
  netYield: number = 0;
  leverage: number = 0;
  fee_factor = 0; // in absolute terms, not %
  status = StrategyStatus.UNINTIALISED;

  readonly rewardTokens: { logo: string }[];
  readonly holdingTokens: (TokenInfo | NFTInfo)[];

  balEnabled = atom(false);
  readonly balanceAtom: Atom<AtomWithQueryResult<BalanceResult, Error>>;
  readonly tvlAtom: Atom<AtomWithQueryResult<AmountInfo, Error>>;

  riskFactor: number = 5;
  risks: string[] = [
    'The strategy involves exposure to smart contracts, which inherently carry risks like hacks, albeit relatively low',
    'APYs shown are just indicative and do not promise exact returns',
  ];

  getSafetyFactorLine() {
    let factorLevel = 'Low';
    if (this.riskFactor > 2) factorLevel = 'Medium';
    if (this.riskFactor >= 4) factorLevel = 'High';
    return `Risk factor: ${this.riskFactor}/5 (${factorLevel} risk)`;
  }

  depositMethods = (inputs: DepositActionInputs): IStrategyActionHook[] => {
    return [];
  };

  withdrawMethods = (inputs: WithdrawActionInputs): IStrategyActionHook[] => {
    return [];
  };

  getTVL = async (): Promise<AmountInfo> => {
    throw new Error('getTVL: Not implemented');
  };

  getUserTVL = async (user: string): Promise<AmountInfo> => {
    throw new Error('getTVL: Not implemented');
  };

  isLive() {
    return isLive(this.liveStatus);
  }

  constructor(
    id: string,
    name: string,
    description: string,
    rewardTokens: { logo: string }[],
    holdingTokens: (TokenInfo | NFTInfo)[],
    liveStatus: StrategyLiveStatus,
    settings: IStrategySettings,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.rewardTokens = rewardTokens;
    this.holdingTokens = holdingTokens;
    console.log('calling getBalanceAtom', id, holdingTokens[0]);
    this.balanceAtom = getBalanceAtom(holdingTokens[0], this.balEnabled);
    this.liveStatus = liveStatus;
    this.settings = settings;
    this.tvlAtom = atomWithQuery((get) => {
      return {
        queryKey: ['tvl', this.id],
        queryFn: async ({ queryKey }: any): Promise<AmountInfo> => {
          return this.getTVL();
        },
        refetchInterval: 15000,
      };
    });
  }
}

export class IStrategy extends IStrategyProps {
  readonly tag: string;

  constructor(
    id: string,
    tag: string,
    name: string,
    description: string,
    rewardTokens: { logo: string }[],
    holdingTokens: (TokenInfo | NFTInfo)[],
    liveStatus = StrategyLiveStatus.ACTIVE,
    settings: IStrategySettings,
  ) {
    super(
      id,
      name,
      description,
      rewardTokens,
      holdingTokens,
      liveStatus,
      settings,
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

  solve(pools: PoolInfo[], amount: string) {
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
      console.error(`${this.tag} - unsolved`, err);
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
