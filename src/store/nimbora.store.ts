import { PoolInfo, ProtocolAtoms2, StrkLendingIncentivesAtom } from './pools';
import { atom } from 'jotai';
import { LendingSpace } from './lending.base';
import { IDapp } from './IDapp.store';
import { customAtomWithFetch } from '@/utils/customAtomWithFetch';
import CONSTANTS from '@/constants';

interface NimboraBaseAprDoc {
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
  token: string;
  tokenManager: string;
  underlying: string;
  underlyingSymbol: string;
  underlyingPrice: string;
  l1Strategy: string;
  decimals: string;
  epoch: string;
  epochDelay: string;
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

export class Nimbora extends IDapp<NimboraBaseAprDoc> {
  name = 'Nimbora';
  link = 'https://app.nimbora.io/';
  logo =
    'https://assets-global.website-files.com/64f0518cbb38bb59ddd7a331/64f1ea84a753c1ed93b2c920_faviconn.png';

  incentiveDataKey = 'Nimbora';

  _computePoolsInfo(data: any) {
    return LendingSpace.computePoolsInfo(
      data,
      this.incentiveDataKey,
      {
        name: this.name,
        link: this.link,
        logo: this.logo,
      },
      this.commonVaultFilter,
    );
  }

  // getBaseAPY(
  //   p: PoolInfo,
  //   data: AtomWithQueryResult<LendingSpace.MyBaseAprDoc[], Error>,
  // ) {
  //   return LendingSpace.getBaseAPY(p, data);
  // }

  commonVaultFilter(poolName: string) {
    const supportedPools = ['nstUSD', 'npeETH', 'nsDAI'];
    return supportedPools.includes(poolName);
  }
}

export const nimbora = new Nimbora();
const NimboraAtoms: ProtocolAtoms2 = {
  baseAPRs: customAtomWithFetch({
    queryKey: 'nimbora_lending_base_aprs',
    url: CONSTANTS.NIMBORA.DEX_APR_API,
  }),
  pools: atom((get) => {
    const poolsInfo = get(StrkLendingIncentivesAtom);
    const empty: PoolInfo[] = [];
    if (!NimboraAtoms.baseAPRs) return empty;
    const baseInfo = get(NimboraAtoms.baseAPRs);
    // console.log('nimbora', baseInfo);
    if (poolsInfo.data) {
      const pools = nimbora._computePoolsInfo(poolsInfo.data);
      return nimbora.addBaseAPYs(pools, baseInfo);
    }
    return empty;
  }),
};
export default NimboraAtoms;
