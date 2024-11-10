import { NextPage } from 'next';
import Image from 'next/image';
import React from 'react';

import ActiveDeposits from './_components/active-deposits';
import RaffleTimer from './_components/raffle-timer';
import RegisterRaffle from './_components/register-raffle';
import ShareOnX from './_components/share-on-x';
import TotalTickets from './_components/total-tickets';

const Raffle: NextPage = () => {
  return (
    <div className="px-5 w-full max-w-[1000px] mx-auto pb-5">
      <div className="flex w-full items-center flex-col-reverse gap-5 lg:gap-0 lg:flex-row justify-between mt-12 bg-gradient-to-r from-[#6F4FF2] to-[#E86277] rounded-md px-3 py-5 lg:px-8 lg:py-2">
        <div className="flex flex-col items-center lg:items-start gap-5">
          <h1 className="text-[#FFFFFF] text-3xl lg:text-5xl font-bold">
            Devcon raffle
          </h1>
          <p className="text-white text-sm lg:text-base text-center lg:text-start">
            Each day, we shall select 3 winners who will receive exclusive merch
            during Starkspace (Devcon, Bangkok)
          </p>

          <button className="border-white border px-4 py-2.5 rounded-md text-white text-sm font-bold transition-all active:scale-90 mt-3">
            Know More
          </button>
        </div>

        <Image
          src="/raffle-hero.svg"
          width={510}
          height={279}
          alt="Raffle Hero Image"
        />
      </div>

      <div className="mt-12 rounded-md bg-gradient-to-r from-[#2f285c] to-[#2b5d4a] p-0.5">
        <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-0 items-center justify-between bg-gradient-to-r from-[#181d29] to-[#172428] h-full rounded-md px-6 py-3">
          <p className="text-[#95F3BD] font-semibold text-base text-center lg:text-xl">
            Earn Raffle tickets for every task and increase chances to win
          </p>

          <div className="flex flex-col items-center gap-2 text-white lg:mr-14">
            <p className="text-base text-transparent bg-clip-text font-medium bg-gradient-to-r from-[#61FCAE] to-[#B0F6FF]">
              Raffle end&apos;s in
            </p>
            <RaffleTimer />
          </div>
        </div>
      </div>

      <div className="mt-9 rounded-md bg-gradient-to-r from-[#2e265c] to-[#2c5e4b] p-0.5">
        <div className="bg-gradient-to-r from-[#171726] to-[#192428] h-full rounded-md px-5 py-6">
          <h4 className="text-white text-base lg:text-2xl font-bold">Tasks</h4>
          <div className="flex items-center justify-between">
            <p className="mt-1 text-white text-sm lg:text-lg">
              Participate and
              <span className="text-[#61FCAE] font-semibold">
                {' '}
                get Raffle tickets
              </span>
            </p>

            <TotalTickets />
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <RegisterRaffle />

            <ActiveDeposits />

            <ShareOnX />
          </div>
        </div>
      </div>

      <div className="mt-9 space-y-2 lg:space-y-1">
        <h5 className="text-white text-base lg:text-xl font-bold mb-0.5">
          Rules:
        </h5>
        <p className="ml-2 text-white text-sm lg:text-base">
          1. 3 unique winners will be selected each day
        </p>
        <p className="ml-2 text-white text-sm lg:text-base">
          2. You just have to register once and you will be part of each round
          automatically
        </p>
        <p className="ml-2 text-white text-sm lg:text-base">
          3. You have to register if you want to participate. This mean you or
          anyone on your behalf will be available t to collect the merch.{' '}
        </p>
        <p className="ml-2 text-white text-sm lg:text-base">
          4. The rewards will be in the form of exclusive merch reserved for you
        </p>
        <p className="ml-2 text-white text-sm lg:text-base">
          5. Selected winners can collect their merch on 13th Nov, from The Fig
          lobby, Bangkok
        </p>
        <p className="ml-2 text-white text-sm lg:text-base">
          6. Winners will be announced on our socials everyday
        </p>
      </div>
    </div>
  );
};

export default Raffle;
