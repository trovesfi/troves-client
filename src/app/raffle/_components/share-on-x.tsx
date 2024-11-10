'use client';

import { Spinner } from '@chakra-ui/react';
import { useAccount } from '@starknet-react/core';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import toast from 'react-hot-toast';

const ShareOnX = () => {
  const { address } = useAccount();

  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(false);
  const [isSharedOnX, setIsSharedOnX] = React.useState(false);

  const handleShare = async () => {
    setLoading(true);

    try {
      const res = await axios.post('/api/raffle', {
        address,
        type: 'SHARED_ON_X',
      });

      if (res?.data?.success) {
        await new Promise((resolve) => setTimeout(resolve, 8000));
        setIsSharedOnX(true);
        toast.success('Successfully completed!', {
          position: 'bottom-right',
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong', {
        position: 'bottom-right',
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!address) return;

    setInitialLoading(true);
    setIsSharedOnX(false);

    (async () => {
      try {
        const res = await axios.get(`/api/tnc/getUser/${address}`, {
          params: { type: 'RAFFLE' },
        });

        if (res?.data?.success && res?.data?.user?.sharedOnX) {
          setIsSharedOnX(true);
        } else setIsSharedOnX(false);
      } catch (error) {
        console.error(error);
        toast.error('Something went wrong');
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [address]);

  return (
    <div className="rounded-md bg-gradient-to-r from-[#322663] to-[#306652] p-0.5">
      <div className="flex flex-col lg:flex-row items-start lg:items-center py-3 lg:py-0 justify-between bg-gradient-to-r from-[#1c1b32] to-[#1e3031] h-full rounded-md px-4 hover:from-[#60fcad] transition-all  hover:to-[#60fcad] group">
        <div className="flex items-center gap-0 lg:gap-3">
          <Image
            src="/raffle-share.svg"
            width={64}
            height={64}
            alt="STRKFarm"
          />
          <p className="text-[#61FCAE] text-sm lg:text-xl font-medium group-hover:text-black">
            RT our tweet
          </p>
        </div>

        <Link
          href="https://hemant.lol"
          target="_blank"
          className="border border-[#36E780] text-white group-hover:border-black group-hover:text-black px-4 py-1 text-sm font-bold rounded-[20px] transition-all active:scale-90 ml-16 lg:ml-0 -mt-3"
          onClick={!isSharedOnX && !initialLoading ? handleShare : () => {}}
        >
          {loading && (
            <Spinner
              mr={2}
              size="xs"
              className="text-[#61FCAE] group-hover:text-black"
            />
          )}
          {initialLoading && 'loading...'}
          {isSharedOnX && 'completed'}
          {!isSharedOnX && !initialLoading && '1 ticket'}
        </Link>
      </div>
    </div>
  );
};

export default ShareOnX;
