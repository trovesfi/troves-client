import strkfarmLogo from '@public/logo.png';
import { atom } from 'jotai';
import CarmineAtoms, { carmine } from './carmine.store';
import EkuboAtoms, { ekubo } from './ekobu.store';
import EndurAtoms, { endur } from './endur.store';
import HaikoAtoms, { haiko } from './haiko.store';
import HashstackAtoms, { hashstack } from './hashstack.store';
import MySwapAtoms, { mySwap } from './myswap.store';
import NimboraDexAtoms, { nimboraDex } from './nimboradex.store';
import NostraDegenAtoms, { nostraDegen } from './nostradegen.store';
import NostraDexAtoms, { nostraDex } from './nostradex.store';
import NostraLendingAtoms, { nostraLending } from './nostralending.store';
import { Category, PoolInfo, PoolType } from './pools';
import { getLiveStatusEnum } from './strategies.atoms';
import STRKFarmAtoms, {
  strkfarm,
  STRKFarmStrategyAPIResult,
} from './strkfarm.atoms';
import VesuAtoms, { vesu } from './vesu.store';
import ZkLendAtoms, { zkLend } from './zklend.store';

export const PROTOCOLS = [
  {
    name: endur.name,
    class: endur,
    atoms: EndurAtoms,
  },
  {
    name: strkfarm.name,
    class: strkfarm,
    atoms: STRKFarmAtoms,
  },
  {
    name: ekubo.name,
    class: ekubo,
    atoms: EkuboAtoms,
  },
  // {
  //   name: jedi.name,
  //   class: jedi,
  //   atoms: JediAtoms,
  // },
  {
    name: mySwap.name,
    class: mySwap,
    atoms: MySwapAtoms,
  },
  // {
  //   name: tenkswap.name,
  //   class: tenkswap,
  //   atoms: TenkSwapAtoms,
  // },
  {
    name: haiko.name,
    class: haiko,
    atoms: HaikoAtoms,
  },
  {
    name: nostraDex.name,
    class: nostraDex,
    atoms: NostraDexAtoms,
  },
  {
    name: nostraDegen.name,
    class: nostraDegen,
    atoms: NostraDegenAtoms,
  },
  {
    name: carmine.name,
    class: carmine,
    atoms: CarmineAtoms,
  },
  // {
  //   name: starkDefi.name,
  //   class: starkDefi,
  //   atoms: StarkDefiAtoms,
  // },
  // {
  //   name: sithswap.name,
  //   class: sithswap,
  //   atoms: SithswapAtoms,
  // },
  {
    name: zkLend.name,
    class: zkLend,
    atoms: ZkLendAtoms,
  },
  {
    name: nostraLending.name,
    class: nostraLending,
    atoms: NostraLendingAtoms,
  },
  {
    name: hashstack.name,
    class: hashstack,
    atoms: HashstackAtoms,
  },
  {
    name: vesu.name,
    class: vesu,
    atoms: VesuAtoms,
  },
  {
    name: nimboraDex.name,
    class: nimboraDex,
    atoms: NimboraDexAtoms,
  },
];

export const ALL_FILTER = 'All';

const allProtocols = PROTOCOLS.map((p) => ({
  name: p.name,
  logo: p.class.logo,
}));

export const filters = {
  categories: [...Object.values(Category)],
  types: [...Object.values(PoolType)],
  protocols: allProtocols.filter(
    (p, index) => allProtocols.findIndex((_p) => _p.name === p.name) === index,
  ),
};

export const filterAtoms = {
  categoriesAtom: atom([ALL_FILTER]),
  typesAtom: atom([ALL_FILTER]),
  protocolsAtom: atom([ALL_FILTER]),
  riskAtom: atom([ALL_FILTER]),
};

export const updateFiltersAtom = atom(
  null,
  (
    get,
    set,
    type: 'categories' | 'poolTypes' | 'protocols' | 'risk',
    newOptions: string[],
  ) => {
    console.log(`filter33`, type, newOptions);
    if (type === 'categories') {
      set(filterAtoms.categoriesAtom, newOptions);
    } else if (type === 'poolTypes') {
      set(filterAtoms.typesAtom, newOptions);
    } else if (type === 'protocols') {
      set(filterAtoms.protocolsAtom, newOptions);
    } else if (type === 'risk') {
      set(filterAtoms.riskAtom, newOptions);
    }
  },
);

const privateProtocols = [
  {
    name: endur.name,
    class: endur,
    atoms: EndurAtoms,
  },
];

export const privatePoolsAtom = atom((get) => {
  // const pools: PoolInfo[] = [];
  // const otherPools = getPrivatePools(get);
  // return [
  //   ...privateProtocols.reduce(
  //     (_pools, p) => _pools.concat(get(p.atoms.pools)),
  //     pools,
  //   ),
  //   ...otherPools,
  // ];
  return [] as PoolInfo[];
});

export const allPoolsAtomUnSorted = atom((get) => {
  const pools: PoolInfo[] = [];
  return PROTOCOLS.reduce(
    (_pools, p) => _pools.concat(get(p.atoms.pools)),
    pools,
  );
});

export function getPoolInfoFromStrategy(
  strat: STRKFarmStrategyAPIResult,
): PoolInfo {
  const category = [Category.Others];
  if (strat.name.includes('STRK')) {
    category.push(Category.STRK);
  } else if (strat.name.includes('USDC')) {
    category.push(Category.Stable);
  } else if (strat.name.includes('ETH')) {
    category.push(Category.ETH);
  }
  return {
    pool: {
      id: strat.id,
      name: strat.name,
      logos: [strat.logo],
    },
    protocol: {
      name: 'STRKFarm',
      link: `/strategy/${strat.id}`,
      logo: strkfarmLogo.src,
    },
    tvl: strat.tvlUsd,
    apr: strat.apy,
    aprSplits: [
      {
        apr: strat.apy,
        title: 'Net Yield',
        description: 'Includes fees & Defi spring rewards',
      },
    ],
    category,
    type: PoolType.Derivatives,
    borrow: {
      apr: 0,
      borrowFactor: 0,
    },
    lending: {
      collateralFactor: 0,
    },
    additional: {
      riskFactor: strat.riskFactor,
      tags: [getLiveStatusEnum(strat.status.number)],
      isAudited: strat.isAudited,
      leverage: strat.leverage,
      is_promoted: strat.name.includes('Stake'),
    },
  };
}

export const allPoolsAtomWithStrategiesUnSorted = atom((get) => {
  const pools: PoolInfo[] = get(allPoolsAtomUnSorted);
  // const strategies = get(strategiesAtom);
  // const strategyPools: PoolInfo[] = strategies.map((strategy) => {
  //   const tvlInfo = get(strategy.tvlAtom);
  //   return getPoolInfoFromStrategy(strategy, tvlInfo.data?.usdValue || 0);
  // });
  // return strategyPools.concat(pools);
  return pools;
});

// const allPoolsAtom = atom<PoolInfo[]>([]);

const SORT_OPTIONS = ['DEFAULT', 'APR', 'TVL', 'RISK'] as const;

// default sort atom with default options APR: high to low, RISK: low to high
const defaultSortAtom = atom<Array<{ field: string; order: 'asc' | 'desc' }>>([
  {
    field: SORT_OPTIONS[1],
    order: 'desc',
  },
  {
    field: SORT_OPTIONS[3],
    order: 'asc',
  },
]);

// sort atom declared
export const sortAtom = atom<Array<{ field: string; order: 'asc' | 'desc' }>>(
  [],
);
// sort pool results function
export const sortPoolsAtom = atom((get) => {
  // get current sort atom
  const sort = get(sortAtom);
  // get default sort atom
  const default_sort = get(defaultSortAtom);
  // get unsort pool data
  const pools = get(allPoolsAtomWithStrategiesUnSorted);
  // if current sort atom exist then reverse the atom else reverse default sort
  const sortCriteria =
    sort.length > 0 ? [...sort].reverse() : [...default_sort].reverse();
  // loop through unsort pools and apply sort
  const sortedPools = [...pools].sort((a, b) => {
    for (const sortItem of sortCriteria) {
      let result = 0;
      if (sortItem.field === SORT_OPTIONS[1]) {
        result = sortItem.order === 'asc' ? a.apr - b.apr : b.apr - a.apr;
      } else if (sortItem.field === SORT_OPTIONS[2]) {
        result = sortItem.order === 'asc' ? a.tvl - b.tvl : b.tvl - a.tvl;
      } else if (sortItem.field === SORT_OPTIONS[3]) {
        result =
          sortItem.order === 'asc'
            ? Math.round(a.additional.riskFactor) -
              Math.round(b.additional.riskFactor)
            : Math.round(b.additional.riskFactor) -
              Math.round(a.additional.riskFactor);
      }
      if (result !== 0) return result;
    }
    return 0;
  });
  return sortedPools;
});

export const filteredPools = atom((get) => {
  console.log(`sorting`, 'filter pools');
  const pools = get(sortPoolsAtom);
  console.log(`sorting`, 'filter pools [2]');
  const categories = get(filterAtoms.categoriesAtom);
  const types = get(filterAtoms.typesAtom);
  const protocols = get(filterAtoms.protocolsAtom);
  const riskLevels = get(filterAtoms.riskAtom);
  console.log(`sorting`, 'filter pools');

  return pools.filter((pool) => {
    // category filter
    if (
      !categories.includes(ALL_FILTER) &&
      !categories.some((category) =>
        pool.category.some((poolCategory) => poolCategory === category),
      )
    )
      return false;

    // type filter
    if (!types.includes(ALL_FILTER) && !types.includes(pool.type.valueOf()))
      return false;

    // protocol filter
    if (
      !protocols.includes(ALL_FILTER) &&
      !protocols.includes(pool.protocol.name)
    )
      return false;

    // risk filter
    if (
      !riskLevels.includes(ALL_FILTER) &&
      !riskLevels.includes(
        Math.round(pool.additional.riskFactor).toFixed(0).toString(),
      )
    ) {
      return false;
    }
    return true;
  });
});
