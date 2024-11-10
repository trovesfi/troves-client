'use client';

import { Spinner } from '@chakra-ui/react';
import { useAccount } from '@starknet-react/core';
import axios from 'axios';
import React from 'react';
import toast from 'react-hot-toast';

const TotalTickets: React.FC = () => {
  const { address } = useAccount();

  const [totalTickets, setTotalTickets] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!address) return;

    setLoading(true);
    setTotalTickets(0);

    (async () => {
      try {
        const res = await axios.get(`/api/tnc/getUser/${address}`, {
          params: { type: 'RAFFLE' },
        });

        if (res?.data?.success && res?.data?.user?.isRaffleParticipant) {
          setTotalTickets((prev) => prev + 1);
          console.log('+1');
        }
        if (res?.data?.success && res?.data?.user?.sharedOnX) {
          setTotalTickets((prev) => prev + 1);
          console.log('+1 +1');
        }
        if (res?.data?.success && res?.data?.user?.activeDeposits) {
          setTotalTickets((prev) => prev + 1);
          console.log('+1 +1 +1');
        }
      } catch (error) {
        console.error(error);
        toast.error('Something went wrong', {
          position: 'bottom-right',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [address]);

  return (
    <p className="text-white text-sm mr-2">
      Your tickets:{' '}
      <span className="text-[#61FCAE] font-semibold">
        {!loading ? totalTickets : <Spinner color="#61FCAE" size="xs" />}
      </span>
    </p>
  );
};

export default TotalTickets;
