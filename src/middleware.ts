import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import redis from './lib/redis';

export const config = {
  matcher: ['/api/:path*'],
};

const RATE_LIMIT_REQUESTS = parseInt(
  process.env.RATE_LIMIT_REQUESTS || '20',
  10,
);
const RATE_LIMIT_WINDOW = process.env.RATE_LIMIT_WINDOW || '10 s';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW as `${number} s`,
  ),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const identifier = ip;

  let success, limit, remaining, reset;
  try {
    const result = await ratelimit.limit(identifier);
    success = result.success;
    limit = result.limit;
    remaining = result.remaining;
    reset = result.reset;
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }

  const response = success
    ? NextResponse.next()
    : NextResponse.json(
        { message: 'Rate limit exceeded', limit, remaining, reset },
        { status: 429 },
      );

  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());

  return response;
}
