import { db } from '@/db';
import { Raffle } from '@prisma/client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  console.log('Authorization header:', authHeader);
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized request');
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const { searchParams } = new URL(request.url);
  let noOfWinners = parseInt(searchParams.get('winnersCount') || '0', 10);
  console.log('No of winners requested:', noOfWinners);

  if (noOfWinners <= 0) {
    return NextResponse.json({
      success: false,
      message: 'Invalid number of winners requested',
    });
  }

  try {
    const raffleParticipants = await db.raffle.findMany({
      where: {
        OR: [
          { isRaffleParticipant: true },
          { sharedOnX: true },
          { activeDeposits: true },
        ],
      },
    });

    if (raffleParticipants.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No raffle participants found',
      });
    }

    console.log('Total raffle participants:', raffleParticipants.length);

    const totalExistingWinners = await db.luckyWinner.findMany({
      select: {
        userId: true,
      },
    });
    if (totalExistingWinners.length == raffleParticipants.length) {
      return NextResponse.json({
        success: false,
        message: 'No new participants found',
      });
    }

    // index to ticket owner map
    const ticketOwners: Raffle[] = [];

    let uniqueUsersCount = 0;
    raffleParticipants.forEach((participant) => {
      const exists = totalExistingWinners.find(
        (winner) => winner.userId === participant.userId,
      );
      if (exists) return;

      uniqueUsersCount++;
      if (participant.isRaffleParticipant) {
        ticketOwners.push(participant);
      }
      if (participant.sharedOnX) {
        ticketOwners.push(participant);
      }
      if (participant.activeDeposits) {
        ticketOwners.push(participant);
      }
    });

    if (uniqueUsersCount < noOfWinners) {
      noOfWinners = uniqueUsersCount;
    }

    if (noOfWinners === 0) {
      return NextResponse.json({
        success: false,
        message: 'No winners to select',
      });
    }

    const luckyWinners: Raffle[] = [];

    // Continue selecting winners until we reach the desired count
    while (luckyWinners.length < noOfWinners) {
      // Try to find a participant from each group in order
      if (ticketOwners.length === 0) continue;

      // Keep searching within the current group until a valid participant is found
      const randomIndex = Math.floor(Math.random() * ticketOwners.length);
      const selectedParticipant = ticketOwners[randomIndex];

      // assert selectedParticipant is not already a winner
      const exists = luckyWinners.find(
        (winner) => winner.userId === selectedParticipant.userId,
      );
      if (exists) continue;

      luckyWinners.push(selectedParticipant);
    }

    // Check if we were able to select enough winners
    if (luckyWinners.length == 0) {
      return NextResponse.json({
        success: false,
        message: 'No winner found',
      });
    }

    // Add selected users to the LuckyWinner table
    const maxRoundIdInfo = await db.luckyWinner.findFirst({
      select: { roundId: true },
      orderBy: { roundId: 'desc' },
    });
    const maxRoundId = maxRoundIdInfo ? maxRoundIdInfo.roundId : 0;
    const newLuckyWinners = await db.luckyWinner.createMany({
      data: luckyWinners.map((userId) => ({
        roundId: maxRoundId + 1,
        raffleId: userId.raffleId,
        userId: userId.userId,
      })),
    });

    console.log('Lucky winners selected successfully:', newLuckyWinners);

    return NextResponse.json({
      success: true,
      message: 'Lucky winners selected successfully',
      luckyWinners: newLuckyWinners,
    });
  } catch (error) {
    console.error('Error selecting lucky winners:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred while selecting lucky winners',
    });
  }
}
