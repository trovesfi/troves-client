import { NextRequest } from 'next/server';
import { getStrategies } from '@/store/strategies.atoms';

export async function GET(req: NextRequest, context: any) {
  const { params } = context;
  const { searchParams } = new URL(req.url);
  const strategyId = params.strategyId;

  const duration = parseInt(searchParams.get('duration') || '7', 10);

  const strategies = getStrategies();
  const strategy = strategies.find((s) => s.id === strategyId);

  if (!strategy) {
    return new Response(JSON.stringify({ error: 'Strategy not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await fetch(`https://app.endur.fi/api/blocks/${duration}`);
  const response = await result.json();

  const blockInfo = response.blocks.map(
    (block: { block: number; timestamp: number }) => {
      return { block: block.block, timestamp: block.timestamp };
    },
  );

  const apyHistory = {
    strategy: strategy.name,
    history: await strategy.getAPYHistory(blockInfo),
  };

  return new Response(JSON.stringify({ apyHistory }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
