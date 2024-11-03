'use client';

import React, { useEffect, useState } from 'react';

const RaffleTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const endDate = new Date('2024-11-11T23:59:59');

    const updateTimer = () => {
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        clearInterval(timer);
      }
    };

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-7 w-[182px]">
      <div className="flex flex-col items-center text-white text-2xl font-semibold gap-0">
        {timeLeft.days}
        <span className="text-[8.1px] text-[#768E7A] leading-[8.1px]">
          Days
        </span>
      </div>
      <div className="flex flex-col items-center text-white text-2xl font-semibold gap-0">
        {timeLeft.hours}
        <span className="text-[8.1px] text-[#768E7A] leading-[8.1px]">Hrs</span>
      </div>
      <div className="flex flex-col items-center text-white text-2xl font-semibold gap-0">
        {timeLeft.minutes}
        <span className="text-[8.1px] text-[#768E7A] leading-[8.1px]">
          Mins
        </span>
      </div>
      <div className="flex flex-col items-center text-white text-2xl font-semibold gap-0">
        {timeLeft.seconds}
        <span className="text-[8.1px] text-[#768E7A] leading-[8.1px]">Sec</span>
      </div>
    </div>
  );
};

export default RaffleTimer;
