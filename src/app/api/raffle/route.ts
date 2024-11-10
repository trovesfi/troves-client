import { NextResponse } from 'next/server';

import { db } from '@/db';
import { getStrategies } from '@/store/strategies.atoms';
import { standariseAddress } from '@/utils';

export async function POST(req: Request) {
  const { address, type } = await req.json();

  if (!address || !type) {
    return NextResponse.json({
      success: false,
      message: 'address not found',
      user: null,
    });
  }

  if (!type || !['SHARED_ON_X', 'ACTIVE_DEPOSITS', 'REGISTER'].includes(type)) {
    return NextResponse.json({
      success: false,
      message: 'Invalid type',
    });
  }

  // standardised address
  let parsedAddress = address;
  try {
    parsedAddress = standariseAddress(address);
  } catch (e) {
    throw new Error('Invalid address');
  }

  const user = await db.user.findFirst({
    where: {
      address: parsedAddress,
    },
  });

  if (!user) {
    return NextResponse.json({
      success: false,
      message: 'User not found',
      user: null,
    });
  }

  if (type === 'REGISTER') {
    const raffleUser = await db.raffle.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (raffleUser) {
      return NextResponse.json({
        success: false,
        message: 'User already registered',
        user: raffleUser,
      });
    }

    const createdUser = await db.raffle.create({
      data: {
        isRaffleParticipant: true,
        User: {
          connect: {
            address: parsedAddress,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User registered for raffle successfully',
      user: createdUser,
    });
  }

  const raffleUser = await db.raffle.findFirst({
    where: {
      userId: user.id,
      isRaffleParticipant: true,
    },
  });

  if (!raffleUser) {
    return NextResponse.json({
      success: false,
      message: 'Registered user not found',
      user: null,
    });
  }

  if (type === 'SHARED_ON_X') {
    const updatedUser = await db.raffle.update({
      where: {
        raffleId: raffleUser.raffleId,
      },
      data: {
        sharedOnX: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Shared on X successfully',
      user: updatedUser,
    });
  }

  if (type === 'ACTIVE_DEPOSITS') {
    const strategies = getStrategies();

    const values = strategies.map(async (strategy) => {
      const balanceInfo = await strategy.getUserTVL(parsedAddress);
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

    if (sum > 10) {
      const createdUser = await db.raffle.update({
        where: {
          raffleId: raffleUser.raffleId,
        },
        data: {
          activeDeposits: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Active deposits found',
        user: createdUser,
      });
    }

    return NextResponse.json({
      success: false,
      message: 'No active deposits found',
      user: null,
    });
  }
}
