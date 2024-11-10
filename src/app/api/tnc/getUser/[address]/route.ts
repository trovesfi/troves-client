import { NextResponse } from 'next/server';

import { db } from '@/db';
import { standariseAddress } from '@/utils';

export async function GET(req: Request, context: any) {
  const { params } = context;
  const address = params.address;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  if (!address) {
    return NextResponse.json({
      success: false,
      message: 'No address found',
    });
  }

  // standardised address
  const parsedAddress = standariseAddress(address);

  const user = await db.user.findFirst({
    where: {
      address: parsedAddress,
    },
    include: {
      Signatures: true,
    },
  });

  if (!user) {
    return NextResponse.json({
      success: false,
      user: null,
    });
  }

  if (type && type === 'RAFFLE') {
    const raffleUser = await db.raffle.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!raffleUser) {
      return NextResponse.json({
        success: false,
        message: 'Raffle user not found',
        user: null,
      });
    }

    return NextResponse.json({
      success: true,
      user: raffleUser,
    });
  }

  return NextResponse.json({
    success: true,
    user,
  });
}
