import CONSTANTS, { TOKENS, provider } from '@/constants';
import { PoolInfo } from '@/store/pools';
import {
  DepositActionInputs,
  IStrategy,
  IStrategySettings,
  StrategyAction,
  StrategyLiveStatus,
  TokenInfo,
  WithdrawActionInputs,
} from './IStrategy';
import ERC20Abi from '@/abi/erc20.abi.json';
import AutoStrkAbi from '@/abi/autoStrk.abi.json';
import MasterAbi from '@/abi/master.abi.json';
import MyNumber from '@/utils/MyNumber';
import { Contract, num, uint256 } from 'starknet';
import { atom } from 'jotai';
import {
  DUMMY_BAL_ATOM,
  getBalance,
  getBalanceAtom,
  getERC20BalanceAtom,
} from '@/store/balance.atoms';
import { getPrice, getTokenInfoFromName } from '@/utils';
import { endur } from '@/store/endur.store';

interface Step {
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

export class AutoXSTRKStrategy extends IStrategy {
  riskFactor = 0.5;
  token: TokenInfo;
  readonly lpTokenName: string;
  readonly strategyAddress: string;

  constructor(
    name: string,
    description: string,
    strategyAddress: string,
    settings: IStrategySettings,
  ) {
    const rewardTokens = [{ logo: CONSTANTS.LOGOS.STRK }];
    const frmToken = TOKENS.find((t) => t.token == strategyAddress);
    if (!frmToken) throw new Error('frmToken undefined');
    const holdingTokens = [frmToken];

    const token = 'STRK';
    super(
      `stake_${token.toLowerCase()}`,
      'Stake STRK',
      name,
      description,
      rewardTokens,
      holdingTokens,
      StrategyLiveStatus.HOT,
      settings,
    );
    this.token = getTokenInfoFromName(token);
    // ! Change this to xSTRK later
    this.lpTokenName = 'xSTRK';

    this.steps = [
      {
        name: `Stake your ${token} to Endur`,
        optimizer: this.optimizer,
        filter: [this.filterSTRKEndur()],
      },
      {
        name: `Collect launch incentives`,
        optimizer: this.optimizer,
        filter: [
          (pools, _, _actions) => {
            const eligiblePools = pools.filter(
              (p) => p.pool.id == 'endur_strk_reward',
            );
            if (!eligiblePools)
              throw new Error(`${this.tag}: [F1] no eligible pools`);
            return eligiblePools;
          },
        ],
      },
    ];
    const _risks = [...this.risks];
    this.risks = [
      this.getSafetyFactorLine(),
      `Your original investment is safe. If you deposit 100 tokens, you will always get at least 100 tokens back, unless due to below reasons.`,
      ..._risks.slice(1),
    ];
    this.strategyAddress = strategyAddress;

    this.settings.alerts = [
      {
        type: 'info',
        text: 'Pro tip: You can deposit STRK or xSTRK by selecting the token from above dropdown. STRK deposited staked to convert to xSTRK',
        tab: 'deposit',
      },
      {
        type: 'warning',
        text: 'On withdrawal, you will receive xSTRK. You can redeem xSTRK for STRK on endur.fi',
        tab: 'withdraw',
      },
    ];
    this.settings.hideHarvestInfo = true;
  }

  filterSTRKEndur() {
    return (
      pools: PoolInfo[],
      amount: string,
      prevActions: StrategyAction[],
    ) => {
      console.log('filterSTRKEndur', pools);
      return pools.filter(
        (p) => p.pool.name == 'STRK' && p.protocol.name == endur.name,
      );
    };
  }

  optimizer(
    eligiblePools: PoolInfo[],
    amount: string,
    actions: StrategyAction[],
  ): StrategyAction[] {
    console.log('optimizer', eligiblePools);
    return [...actions, { pool: eligiblePools[0], amount, isDeposit: true }];
  }

  getUserTVL = async (user: string) => {
    if (this.liveStatus == StrategyLiveStatus.COMING_SOON)
      return {
        amount: MyNumber.fromEther('0', this.token.decimals),
        usdValue: 0,
        tokenInfo: this.token,
      };

    // returns zToken
    const balanceInfo = await getBalance(this.holdingTokens[0], user);
    if (!balanceInfo.tokenInfo) {
      return {
        amount: MyNumber.fromEther('0', this.token.decimals),
        usdValue: 0,
        tokenInfo: this.token,
      };
    }
    const price = await getPrice(this.token);
    console.log('getUserTVL autoc', price, balanceInfo.amount.toEtherStr());
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

    const strategyContract = new Contract(
      AutoStrkAbi,
      this.strategyAddress,
      provider,
    );
    const asset = num.getHexString(
      (await strategyContract.call('asset', [])).toString(),
    );
    console.log(`getTVL asset`, asset);
    const STRKINfo = getTokenInfoFromName('STRK');
    const isSTRK = asset == STRKINfo.token;
    const xSTRKInfo = getTokenInfoFromName('xSTRK');
    const isxSTRK = asset == xSTRKInfo.token;
    console.log(`getTVL isSTRK`, isSTRK, isxSTRK);
    if (isSTRK) {
      const totalAssets = new MyNumber(
        (await strategyContract.call('total_assets', [])).toString(),
        STRKINfo.decimals,
      );
      const price = await getPrice(this.token);
      return {
        amount: totalAssets,
        usdValue: Number(totalAssets.toEtherStr()) * price,
        tokenInfo: STRKINfo,
      };
    } else if (isxSTRK) {
      const xSTRKTotalAssets = new MyNumber(
        (await strategyContract.call('total_assets', [])).toString(),
        xSTRKInfo.decimals,
      );
      const xSTRKContract = new Contract(
        AutoStrkAbi,
        xSTRKInfo.token,
        provider,
      );
      const strkAmount = new MyNumber(
        (
          await xSTRKContract.call('convert_to_assets', [
            uint256.bnToUint256(xSTRKTotalAssets.toString()),
          ])
        ).toString(),
        STRKINfo.decimals,
      );
      const price = await getPrice(this.token);
      return {
        amount: strkAmount,
        usdValue: Number(strkAmount.toEtherStr()) * price,
        tokenInfo: STRKINfo,
      };
    }
    throw new Error(`getTVL asset not STRK or xSTRK`);
  };

  depositMethods = (inputs: DepositActionInputs) => {
    const { amount, address, provider } = inputs;
    const baseTokenInfo: TokenInfo = TOKENS.find(
      (t) => t.name == this.token.name,
    ) as TokenInfo; //
    const xTokenInfo: TokenInfo = TOKENS.find(
      (t) => t.name == this.lpTokenName,
    ) as TokenInfo;

    if (!address || address == '0x0') {
      return [
        {
          tokenInfo: baseTokenInfo,
          calls: [],
          balanceAtom: DUMMY_BAL_ATOM,
        },
        {
          tokenInfo: xTokenInfo,
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
    const xTokenContract = new Contract(ERC20Abi, xTokenInfo.token, provider);
    const masterContract = new Contract(
      MasterAbi,
      CONSTANTS.CONTRACTS.Master,
      provider,
    );
    const strategyContract = new Contract(
      AutoStrkAbi,
      this.strategyAddress,
      provider,
    );

    // base token
    const call11 = baseTokenContract.populate('approve', [
      masterContract.address,
      uint256.bnToUint256(amount.toString()),
    ]);
    const call12 = masterContract.populate('invest_to_xstrk_auto', [
      this.strategyAddress,
      uint256.bnToUint256(amount.toString()),
      address,
    ]);

    // zToken
    // ! switch to xSTRK later
    const call21 = xTokenContract.populate('approve', [
      this.strategyAddress,
      uint256.bnToUint256(amount.toString()),
    ]);
    const call22 = strategyContract.populate('deposit', [
      uint256.bnToUint256(amount.toString()),
      address,
    ]);

    const calls1 = [call11, call12];
    const calls2 = [call21, call22];

    return [
      {
        tokenInfo: baseTokenInfo,
        calls: calls1,
        balanceAtom: getBalanceAtom(baseTokenInfo, atom(true)),
      },
      {
        tokenInfo: xTokenInfo,
        calls: calls2,
        balanceAtom: getBalanceAtom(xTokenInfo, atom(true)),
      },
    ];
  };

  withdrawMethods = (inputs: WithdrawActionInputs) => {
    const { amount, address, provider } = inputs;
    const frmToken: TokenInfo = TOKENS.find(
      (t) => t.token == this.strategyAddress,
    ) as TokenInfo;

    if (!address || address == '0x0') {
      return [
        {
          tokenInfo: frmToken,
          calls: [],
          balanceAtom: DUMMY_BAL_ATOM,
        },
      ];
    }

    // const baseTokenContract = new Contract(ERC20Abi, baseTokenInfo.token, provider);
    const frmTokenContract = new Contract(ERC20Abi, frmToken.token, provider);
    // const masterContract = new Contract(MasterAbi, CONSTANTS.CONTRACTS.Master, provider);
    const strategyContract = new Contract(
      AutoStrkAbi,
      this.strategyAddress,
      provider,
    );

    // base token
    // const call11 = baseTokenContract.populate("approve", [masterContract.address, uint256.bnToUint256(amount.toString())])
    // const call12 = masterContract.populate("invest_auto_strk", [this.strategyAddress, uint256.bnToUint256(amount.toString()), address])

    // zToken
    // const call1 = frmTokenContract.populate('approve', [
    //   this.strategyAddress,
    //   uint256.bnToUint256(amount.toString()),
    // ]);
    const call2 = strategyContract.populate('redeem', [
      uint256.bnToUint256(amount.toString()),
      address,
      address,
    ]);

    const calls = [call2];

    return [
      {
        tokenInfo: frmToken,
        calls,
        balanceAtom: getERC20BalanceAtom(frmToken),
      },
    ];
  };
}
