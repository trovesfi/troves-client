import CONSTANTS, { NFTS, TokenName } from '@/constants';
import { PoolInfo } from '@/store/pools';
import {
  DepositActionInputs,
  IStrategy,
  IStrategySettings,
  NFTInfo,
  StrategyAction,
  StrategyLiveStatus,
  TokenInfo,
  WithdrawActionInputs,
} from './IStrategy';
import { zkLend } from '@/store/zklend.store';
import ERC20Abi from '@/abi/erc20.abi.json';
import DeltaNeutralAbi from '@/abi/deltraNeutral.abi.json';
import MyNumber from '@/utils/MyNumber';
import { Call, Contract, uint256 } from 'starknet';
import { nostraLending } from '@/store/nostralending.store';
import { getPrice, getTokenInfoFromName, standariseAddress } from '@/utils';
import {
  DUMMY_BAL_ATOM,
  getBalance,
  getBalanceAtom,
  getERC20Balance,
} from '@/store/balance.atoms';
import { atom } from 'jotai';
import { IDapp } from '@/store/IDapp.store';
import { LendingSpace } from '@/store/lending.base';

export class DeltaNeutralMM extends IStrategy {
  riskFactor = 0.75;
  token: TokenInfo;
  readonly secondaryToken: string;
  readonly strategyAddress: string;
  // Factor of Amount to be deposited/borrowed at each step relative to the previous step
  readonly stepAmountFactors: number[];
  fee_factor = 0.1; // 10% fee

  protocol1: IDapp<LendingSpace.MyBaseAprDoc[]>;
  protocol2: IDapp<LendingSpace.MyBaseAprDoc[]>;
  constructor(
    token: TokenInfo,
    name: string,
    description: string,
    secondaryTokenName: TokenName,
    strategyAddress: string,
    stepAmountFactors: number[],
    liveStatus: StrategyLiveStatus,
    settings: IStrategySettings,
    protocol1: IDapp<LendingSpace.MyBaseAprDoc[]> = zkLend,
    protocol2: IDapp<LendingSpace.MyBaseAprDoc[]> = nostraLending,
  ) {
    const rewardTokens = [{ logo: CONSTANTS.LOGOS.STRK }];
    const nftInfo = NFTS.find(
      (nft) =>
        standariseAddress(nft.address) == standariseAddress(strategyAddress),
    );
    if (!nftInfo) {
      throw new Error('DeltaMM: NFT not found');
    }
    const holdingTokens: (TokenInfo | NFTInfo)[] = [nftInfo];
    super(
      name.toLowerCase().replaceAll(' ', '_'),
      'DeltaNeutralMM',
      name,
      description,
      rewardTokens,
      holdingTokens,
      liveStatus,
      settings,
    );
    this.token = token;
    this.protocol1 = protocol1;
    this.protocol2 = protocol2;

    this.steps = [
      {
        name: `Supply's your ${token.name} to ${protocol1.name}`,
        optimizer: this.optimizer,
        filter: [this.filterMainToken],
      },
      {
        name: `Borrow ${secondaryTokenName} from ${protocol1.name}`,
        optimizer: this.optimizer,
        filter: [this.filterSecondaryToken],
      },
      {
        name: `Deposit ${secondaryTokenName} to ${protocol2.name}`,
        optimizer: this.optimizer,
        filter: [this.filterSecondaryToken],
      },
      {
        name: `Borrow ${token.name} from ${protocol2.name}`,
        optimizer: this.optimizer,
        filter: [this.filterMainToken],
      },
      {
        name: `Loop back to step 1, repeat 3 more times`,
        optimizer: this.getLookRepeatYieldAmount,
        filter: [this.filterMainToken],
      },
      {
        name: `Re-invest your STRK Rewards every 7 days (Compound)`,
        optimizer: this.compounder,
        filter: [this.filterTokenByProtocol('STRK', this.protocol1)],
      },
    ];

    if (stepAmountFactors.length != 5) {
      throw new Error(
        'stepAmountFactors length should be equal to steps length',
      );
    }
    this.stepAmountFactors = stepAmountFactors;

    const _risks = [...this.risks];
    this.risks = [
      this.getSafetyFactorLine(),
      `For upto a week, your position value may reduce due to high borrow APR. This will be compensated by STRK rewards.`,
      `Your original investment is safe. If you deposit 100 tokens, you will always get at least 100 tokens back, unless due to below reasons.`,
      `Technical failures in rebalancing positions to maintain healthy health factor may result in liquidations.`,
      ..._risks.slice(1),
    ];
    this.secondaryToken = secondaryTokenName;
    this.strategyAddress = strategyAddress;
  }

  filterMainToken(
    pools: PoolInfo[],
    amount: string,
    prevActions: StrategyAction[],
  ) {
    const dapp =
      prevActions.length == 0 || prevActions.length == 4
        ? this.protocol1
        : this.protocol2;
    return pools.filter(
      (p) => p.pool.name == this.token.name && p.protocol.name == dapp.name,
    );
  }

  filterSecondaryToken(
    pools: PoolInfo[],
    amount: string,
    prevActions: StrategyAction[],
  ) {
    const dapp = prevActions.length == 1 ? this.protocol1 : this.protocol2;
    return pools.filter(
      (p) => p.pool.name == this.secondaryToken && p.protocol.name == dapp.name,
    );
  }

  optimizer(
    eligiblePools: PoolInfo[],
    amount: string,
    actions: StrategyAction[],
  ): StrategyAction[] {
    console.log('optimizer', actions.length, this.stepAmountFactors);
    const _amount = (
      Number(amount) * this.stepAmountFactors[actions.length]
    ).toFixed(2);
    const pool = { ...eligiblePools[0] };
    const isDeposit = actions.length == 0 || actions.length == 2;
    const effectiveAPR = pool.aprSplits.reduce((a, b) => {
      if (b.apr == 'Err') return a;
      if (!isDeposit) return a + Number(b.apr);
      if (b.title.includes('STRK rewards')) {
        return a + Number(b.apr) * (1 - this.fee_factor);
      }
      return a + Number(b.apr);
    }, 0);
    pool.apr = isDeposit ? effectiveAPR : pool.borrow.apr;
    return [
      ...actions,
      {
        pool,
        amount: _amount,
        isDeposit: actions.length == 0 || actions.length == 2,
      },
    ];
  }

  getLookRepeatYieldAmount(
    eligiblePools: PoolInfo[],
    amount: string,
    actions: StrategyAction[],
  ) {
    console.log('getLookRepeatYieldAmount', amount, actions);
    let full_amount = Number(amount);
    this.stepAmountFactors.slice(0, 4).forEach((factor, i) => {
      full_amount /= factor;
    });
    const excessFactor = this.stepAmountFactors[4];
    const amount1 = excessFactor * full_amount;
    const exp1 = amount1 * this.actions[0].pool.apr;
    const amount2 = this.stepAmountFactors[1] * amount1;
    const exp2 =
      amount2 * (this.actions[2].pool.apr - this.actions[1].pool.borrow.apr);
    const amount3 = this.stepAmountFactors[3] * amount2;
    const exp3 = -amount3 * this.actions[3].pool.borrow.apr;
    const effecitveAmount = amount1 - amount3;
    const effectiveAPR = (exp1 + exp2 + exp3) / effecitveAmount;
    const pool: PoolInfo = { ...eligiblePools[0] };
    pool.apr = effectiveAPR;
    const strategyAction: StrategyAction = {
      pool,
      amount: effecitveAmount.toString(),
      isDeposit: true,
    };
    console.log(
      'getLookRepeatYieldAmount exp1',
      this.id,
      exp1,
      full_amount,
      exp2,
      amount2,
      this.actions[2],
      this.actions[1],
      exp3,
      amount1,
      amount3,
    );
    return [...actions, strategyAction];
  }

  compounder(
    eligiblePools: PoolInfo[],
    amount: string,
    actions: StrategyAction[],
  ): StrategyAction[] {
    const amountWeights = this.actions.reduce((a, pool) => {
      const sign = pool.isDeposit ? 1 : -1;
      const apr = pool.isDeposit ? pool.pool.apr : pool.pool.borrow.apr;
      console.log('compounder2', sign, pool.amount, apr);
      return sign * Number(pool.amount) * apr + a;
    }, 0);
    const amountIn = Number(this.actions[0].amount);
    const baseApr = amountWeights / amountIn;
    const compoundingApr = (1 + baseApr / 52) ** 52 - 1;
    console.log(
      'compounder',
      amountIn,
      amountWeights,
      baseApr,
      compoundingApr,
      actions,
    );
    return [
      ...actions,
      {
        pool: { ...eligiblePools[0], apr: compoundingApr - baseApr },
        amount: amountIn.toFixed(2),
        isDeposit: true,
      },
    ];
  }

  depositMethods = (inputs: DepositActionInputs) => {
    const { amount, address, provider } = inputs;
    const baseTokenInfo = this.token;

    if (!address || address == '0x0') {
      return [
        {
          tokenInfo: baseTokenInfo,
          calls: [],
          balanceAtom: DUMMY_BAL_ATOM,
        },
      ];
    }

    const baseTokenContract = new Contract(
      ERC20Abi,
      baseTokenInfo.token,
      provider,
    );
    const strategyContract = new Contract(
      DeltaNeutralAbi,
      this.strategyAddress,
      provider,
    );

    // base token
    const call11 = baseTokenContract.populate('approve', [
      strategyContract.address,
      uint256.bnToUint256(amount.toString()),
    ]);
    const call12 = strategyContract.populate('deposit', [
      uint256.bnToUint256(amount.toString()),
      address,
    ]);

    const calls1 = [call11, call12];

    return [
      {
        tokenInfo: baseTokenInfo,
        calls: calls1,
        balanceAtom: getBalanceAtom(baseTokenInfo, atom(true)),
      },
    ];
  };

  getUserTVL = async (user: string) => {
    if (this.liveStatus == StrategyLiveStatus.COMING_SOON)
      return {
        amount: MyNumber.fromEther('0', this.token.decimals),
        usdValue: 0,
        tokenInfo: this.token,
      };
    const balanceInfo = await getBalance(this.holdingTokens[0], user);
    if (!balanceInfo.tokenInfo) {
      return {
        amount: MyNumber.fromEther('0', this.token.decimals),
        usdValue: 0,
        tokenInfo: this.token,
      };
    }
    const price = await getPrice(balanceInfo.tokenInfo);
    console.log('getUserTVL dnmm', price, balanceInfo.amount.toEtherStr());
    return {
      amount: balanceInfo.amount,
      usdValue: Number(balanceInfo.amount.toEtherStr()) * price,
      tokenInfo: balanceInfo.tokenInfo,
    };
  };

  getTVL = async () => {
    if (!this.isLive())
      return {
        amount: MyNumber.fromEther('0', this.token.decimals),
        usdValue: 0,
        tokenInfo: this.token,
      };

    try {
      const mainTokenName = this.token.name;
      const zToken = getTokenInfoFromName(`z${mainTokenName}`);

      const bal = await getERC20Balance(zToken, this.strategyAddress);
      console.log('getTVL', bal.amount.toString());
      // This reduces the zToken TVL to near actual deposits made by users wihout looping
      const discountFactor = this.stepAmountFactors[4];
      const amount = bal.amount.operate('div', 1 + discountFactor);
      console.log('getTVL1', amount.toString());
      const price = await getPrice(this.token);
      return {
        amount,
        usdValue: Number(amount.toEtherStr()) * price,
        tokenInfo: this.token,
      };
    } catch (error) {
      console.error('Error fetching TVL:', error);
      return {
        amount: MyNumber.fromEther('0', this.token.decimals),
        usdValue: 0,
        tokenInfo: this.token,
      };
    }
  };

  withdrawMethods = (inputs: WithdrawActionInputs) => {
    const { amount, address, provider, isMax } = inputs;
    const mainToken = { ...this.token };

    // removing max amount restrictions on withdrawal
    mainToken.maxAmount = MyNumber.fromEther(
      '100000000000',
      mainToken.maxAmount.decimals,
    );

    if (!address || address == '0x0') {
      return [
        {
          tokenInfo: mainToken,
          calls: [],
          balanceAtom: DUMMY_BAL_ATOM,
        },
      ];
    }

    const strategyContract = new Contract(
      DeltaNeutralAbi,
      this.strategyAddress,
      provider,
    );

    const finalAmount = isMax
      ? new MyNumber(uint256.UINT_256_MAX.toString(), amount.decimals)
      : amount;
    const call = strategyContract.populate('withdraw', [
      uint256.bnToUint256(finalAmount.toString()),
      address,
      500, // 5% max slippage
    ]);

    const calls: Call[] = [call];

    const nftInfo = NFTS.find(
      (nft) =>
        standariseAddress(nft.address) ==
        standariseAddress(this.strategyAddress),
    );
    if (!nftInfo) {
      throw new Error('DeltaMM: NFT not found');
    }
    return [
      {
        tokenInfo: mainToken,
        calls,
        balanceAtom: getBalanceAtom(nftInfo, atom(true)),
      },
    ];
  };
}
