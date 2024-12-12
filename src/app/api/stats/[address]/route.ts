import { getStrategies } from '@/store/strategies.atoms';
import { standariseAddress } from '@/utils';
import { NextResponse } from 'next/server';

export const revalidate = 0;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, context: any) {
  const { params } = context;
  const addr = params.address;

  // standardised address
  let pAddr = addr;
  try {
    pAddr = standariseAddress(addr);
  } catch (e) {
    throw new Error('Invalid address');
  }

  const strategies = getStrategies();
  const values = strategies.map(async (strategy) => {
    const balanceInfo = await strategy.getUserTVL(pAddr);
    return {
      id: strategy.id,
      usdValue: balanceInfo.usdValue,
      tokenInfo: {
        name: balanceInfo.tokenInfo.name,
        symbol: balanceInfo.tokenInfo.name,
        logo: balanceInfo.tokenInfo.logo,
        decimals: balanceInfo.tokenInfo.decimals,
        displayDecimals: balanceInfo.tokenInfo.displayDecimals,
      },
      amount: balanceInfo.amount.toEtherStr(),
    };
  });

  const result = await Promise.all(values);
  const sum = result.reduce((acc, item) => acc + item.usdValue, 0);
  console.log({ pAddr, sum });
  return NextResponse.json({
    holdingsUSD: sum,
    strategyWise: result,
  });
}
