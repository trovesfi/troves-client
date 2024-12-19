import { NextResponse } from 'next/server';
import { ec, hash } from 'starknet';
import { standariseAddress } from '../../../../../utils';
import OGNFTUsersJson from '../../../../../../public/og_nft_eligible_users.json';

export const revalidate = 3600;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: any) {
  try {
    const { params } = context;
    const addr = params.address;

    // standardised address
    let pAddr = addr;
    try {
      pAddr = standariseAddress(addr);
    } catch (e) {
      throw new Error('Invalid address');
    }

    const queryAddr = pAddr;

    if (!process.env.ACCOUNT_PK) {
      throw new Error('Invalid signer');
    }

    const isOgNFTUser = OGNFTUsersJson.includes(queryAddr);

    // total ogNFTUsers
    const totalOgNFTUsers = OGNFTUsersJson.length;

    console.log('isOgUser', isOgNFTUser);
    if (!isOgNFTUser) {
      return NextResponse.json(
        {
          address: '',
          hash: '',
          isOgNFTUser: false,
          sig: [],
          totalOgNFTUsers,
        },
        {
          status: 200,
        },
      );
    }

    const hash1 = hash.computePedersenHash(pAddr, 0);

    const sig = ec.starkCurve.sign(hash1, process.env.ACCOUNT_PK);

    return NextResponse.json({
      address: pAddr,
      isOgNFTUser,
      hash: hash1,
      sig: [sig.r.toString(), sig.s.toString()],
      totalOgNFTUsers,
    });
  } catch (err) {
    console.error('Error /api/users/:address', err);
    return NextResponse.json(
      {
        address: '',
        hash: '',
        sig: [],
      },
      {
        status: 500,
      },
    );
  }
}
