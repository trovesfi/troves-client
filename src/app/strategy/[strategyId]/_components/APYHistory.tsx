import { Box, Flex, Text } from '@chakra-ui/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import { useState, useMemo } from 'react';

type TimeRange = '1d' | '7d' | '30d' | 'all';

interface APYHistoryData {
  month: string;
  apy: number;
}

const dummyAPYHistory: APYHistoryData[] = (() => {
  const days = 60;
  const today = new Date();
  const data: APYHistoryData[] = [];
  const baseAPY = 4.0;
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayStr = date.toISOString().slice(0, 10);

    const apy =
      baseAPY +
      Math.sin(i / 7) * 0.2 +
      Math.random() * 0.1 +
      (i > 30 ? 0.5 : 0);
    data.push({
      month: dayStr,
      apy: Number(apy.toFixed(2)),
    });
  }
  return data;
})();

function getMinMax<T>(arr: T[], key: keyof T & string): [number, number] {
  const values = arr.map((item) => item[key] as unknown as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [min - 1, max + 1];
  }
  return [min, max];
}

function generateTicks([min, max]: [number, number]): number[] {
  const step = Math.max(0.1, (max - min) / 4);
  return [min, min + step, min + 2 * step, min + 3 * step, max];
}

function formatYAxis(value: number): string {
  return `${value.toFixed(1)}%`;
}

const timeRangeToDays: Record<TimeRange, number> = {
  '1d': 10,
  '7d': 7,
  '30d': 30,
  all: dummyAPYHistory.length,
};

const renderAPYHistoryChart = (
  selectedRange: TimeRange,
  onRangeChange: (range: TimeRange) => void,
  filteredData: APYHistoryData[],
) => {
  const yAxisDomain: [number, number] = getMinMax(filteredData, 'apy');

  return (
    <Box
      className="faded-purple-gradient"
      borderRadius="xl"
      boxShadow="lg"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      height="100%"
      width={'70%'}
      padding={'10px'}
    >
      <Flex
        align="center"
        justify="space-between"
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor="border_grey"
        borderBottomWidth="1px"
      >
        <Text fontWeight="bold" fontSize="lg" color="white">
          APY History
        </Text>
        <TimeRangeSelector
          selectedRange={selectedRange}
          onRangeChange={onRangeChange}
        />
      </Flex>
      <Box p={4} flex="1 1 0" display="flex" flexDirection="column">
        <Box flex="1 1 0" minHeight="300px">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              syncId="validator-charts"
            >
              <defs>
                <linearGradient id="colorAPY" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="rgba(16, 185, 129, 0.8)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="rgba(16, 185, 129, 0.1)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="none"
                opacity={0.4}
              />
              <XAxis
                dataKey="month"
                stroke="none"
                tick={{ fill: '#868898', fontSize: 10 }}
                tickMargin={10}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleString('default', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
                type="category"
              />
              <YAxis
                stroke="#10B981"
                tick={{ fill: '#868898', fontSize: 10 }}
                tickMargin={14}
                ticks={generateTicks(yAxisDomain)}
                tickFormatter={formatYAxis}
                domain={yAxisDomain}
                width={60}
                axisLine={false}
                tickLine={false}
              />
              <Area
                type="monotone"
                dataKey="apy"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorAPY)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
};

function APYHistory() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('all');
  const days = timeRangeToDays[selectedRange];
  const filteredData = useMemo(
    () => dummyAPYHistory.slice(-days),
    [selectedRange],
  );
  return (
    <>{renderAPYHistoryChart(selectedRange, setSelectedRange, filteredData)}</>
  );
}

export function APYHistoryTab() {
  return (
    <Box background="black">
      <Flex
        maxWidth={'1152px'}
        margin={'0 auto'}
        flexDirection="column"
        gap="16px"
        width="100%"
        padding={'32px 0px'}
      >
        <APYHistory />
      </Flex>
    </Box>
  );
}
