import type { PoolType } from "../types";

export const POOL_FILTERS: { label: string; value: PoolType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Yield", value: PoolType.Yield },
  { label: "Liquidity", value: PoolType.Liquidity },
  { label: "Staking", value: PoolType.Staking },
];
