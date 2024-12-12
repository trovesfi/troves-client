import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import redis from './lib/redis';

export const config = {
  matcher: ['/api/:path*'],
};

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '10 s'),
  prefix: '@upstash/ratelimit',
  analytics: true,
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
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }

  if (!success) {
    return NextResponse.json(
      { message: 'Rate limit exceeded', limit, remaining, reset },
      { status: 429 },
    );
  }

  return NextResponse.next();
}
