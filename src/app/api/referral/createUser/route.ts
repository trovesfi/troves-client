import { NextResponse } from 'next/server';

import { db } from '@/db';
import { standariseAddress } from '@/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isSixDigitAlphanumeric(str: string) {
  const regex = /^[a-zA-Z0-9]{6}$/;
  return regex.test(str);
}

export async function POST(req: Request) {
  const {
    address,
    myReferralCode,
    referrerAddress: _referrerAddress,
  } = await req.json();
  let referrerAddress: string | null = null;
  if (_referrerAddress) {
    referrerAddress = standariseAddress(_referrerAddress);
  }

  // todo: Ask user to sign with the referrer address as input and send the signed msg
  // verify the signature is signed by address and contains the referrer address

  if (!address) {
    return NextResponse.json({
      success: false,
      message: 'No address found',
    });
  }

  // referral value check is important bcz, an attacker can send a very big or small code
  // can break the UI
  if (!myReferralCode || !isSixDigitAlphanumeric(myReferralCode)) {
    return NextResponse.json({
      success: false,
      message: 'Not a valid referral code',
    });
  }

  // standardised address
  const parsedAddress = standariseAddress(address);

  // do referrer validations
  if (referrerAddress) {
    const referrer = await db.user.findFirst({
      where: {
        address: referrerAddress,
      },
    });

    if (!referrer) {
      // ensures referrer is valid
      referrerAddress = null;
    }

    // if they are trying to refer themselves, means no referrer
    if (referrerAddress === parsedAddress) {
      referrerAddress = null;
    }
  }

  // ensure user doesnt exist
  const user = await db.user.findFirst({
    where: {
      address: standariseAddress(address),
    },
  });

  if (user) {
    return NextResponse.json({
      success: false,
      message: 'User already exists',
    });
  }

  const newUserData = {
    address: parsedAddress,
    referralCode: myReferralCode,
  };

  let result = [];
  if (referrerAddress) {
    result = await db.$transaction([
      db.user.create({
        data: newUserData,
      }),
      // since referrer is present, update referrer's referral count and add refree
      db.user.update({
        where: {
          address: standariseAddress(referrerAddress),
        },
        data: {
          referrals: {
            create: {
              refreeAddress: parsedAddress,
            },
          },
          referralCount: { increment: 1 },
        },
      }),
    ]);
  } else {
    result = [
      await db.user.create({
        data: newUserData,
      }),
    ];
  }

  console.info('newUser', result[0]);
  console.info('referralUpdate', result[1], referrerAddress);

  const newUser = result[0];
  if (!newUser) {
    return NextResponse.json({
      success: false,
      message: 'Error creating user',
      user: null,
    });
  }

  return NextResponse.json({
    success: true,
    message: 'User created successfully',
    user: newUser,
  });
}
