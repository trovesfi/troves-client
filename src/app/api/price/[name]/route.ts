import { NextResponse } from 'next/server';

export const revalidate = 300; // 5 mins
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// only meant for backend calls
async function initRedis() {
  try {
    console.log('initRedis server');
    // eslint-disable-next-line
    const strkFarmSdk = require('strkfarm-sdk');
    console.log('strkFarmSdk', strkFarmSdk);
    const pricer = new strkFarmSdk.PricerRedis(null, []);
    if (!process.env.REDIS_URL) {
      console.warn('REDIS_URL not set');
      return;
    }
    await pricer.initRedis(process.env.REDIS_URL);
    return pricer;
  } catch (e) {
    console.warn('initRedis error', e);
  }
}

export async function GET(req: Request, context: any) {
  try {
    const { params } = context;
    const tokenName = params.name;

    if (!tokenName) {
      throw new Error('Invalid token');
    }

    const redisClient = await initRedis();
    if (!redisClient) {
      throw new Error('Invalid redis');
    }

    const priceInfo = await redisClient.getPrice(tokenName);
    console.log('getPrice redis', priceInfo, tokenName);
    await redisClient.close();
    return NextResponse.json({
      ...priceInfo,
      name: tokenName,
    });
  } catch (err) {
    console.error('Error /api/price/:name', err);
    return NextResponse.json(
      {},
      {
        status: 500,
      },
    );
  }
}
