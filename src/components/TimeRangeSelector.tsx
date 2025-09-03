'use client';

import { Button, Flex } from '@chakra-ui/react';

type TimeRange = '1d' | '7d' | '30d' | 'all';

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

const timeRanges: TimeRange[] = ['1d', '7d', '30d', 'all'];

export default function TimeRangeSelector({
  selectedRange,
  onRangeChange,
}: TimeRangeSelectorProps) {
  return (
    <Flex gap={0}>
      {timeRanges.map((range, index) => (
        <Button
          key={range}
          onClick={() => onRangeChange(range)}
          textTransform="uppercase"
          fontSize="xs"
          fontWeight="semibold"
          px={3}
          py={2}
          borderLeftRadius={index === 0 ? 'md' : 'none'}
          borderRightRadius={index === timeRanges.length - 1 ? 'md' : 'none'}
          borderWidth={1}
          borderColor={'text_grey_60p'}
          borderRightWidth={
            (index === 1 || index === 2) && selectedRange !== range ? 0 : 1
          }
          bg={selectedRange === range ? 'purple' : 'transparent'}
          color={selectedRange === range ? 'bg_4' : 'text_grey_90p'}
          _hover={{ bg: 'inkBlack', color: 'white' }}
          transition="all 0.2s"
        >
          {range}
        </Button>
      ))}
    </Flex>
  );
}
