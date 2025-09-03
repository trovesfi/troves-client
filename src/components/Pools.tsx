'use client';

import { CombinedFilters } from '@/components/Filters';
import {
  allPoolsAtomUnSorted,
  filteredPools,
  sortAtom,
} from '@/store/protocols';
import {
  Pagination,
  PaginationContainer,
  PaginationNext,
  PaginationPage,
  PaginationPageGroup,
  PaginationPrevious,
  usePagination,
} from '@ajna/pagination';
import {
  Box,
  Container,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useMemo, useState } from 'react';
import YieldCard, { HeaderSorter } from './YieldCard';

function MyPagination(props: {
  pagesCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pages: number[];
}) {
  const { pagesCount, currentPage, setCurrentPage, pages } = props;
  return (
    <Pagination
      pagesCount={pagesCount}
      currentPage={currentPage}
      isDisabled={false}
      onPageChange={(page) => {
        setCurrentPage(page);
      }}
    >
      <PaginationContainer align="right" float={'right'} padding={'0px'}>
        <PaginationPrevious
          marginRight="4px"
          bg="mycard_light"
          color="text_secondary"
          _hover={{
            bg: 'mycard_light_2x',
          }}
        >
          <Text>{'<'}</Text>
        </PaginationPrevious>
        <PaginationPageGroup>
          {pages.map((page: number) => (
            <PaginationPage
              key={`pagination_page_${page}`}
              page={page}
              padding={'0px 15px'}
              isActive={page === currentPage}
              background={
                page === currentPage ? 'bright_purple' : 'mycard_light'
              }
              fontSize={'13px'}
              color={page === currentPage ? 'black' : 'text_primary'}
              _active={{
                bg: 'purple',
                color: 'black',
              }}
              _hover={{
                bg: page === currentPage ? 'purple_hover_2' : 'mycard_light_2x',
                color: page === currentPage ? 'black' : 'text_primary',
              }}
            />
          ))}
        </PaginationPageGroup>
        <PaginationNext
          marginLeft="4px"
          bg="mycard_light"
          color="purple_gray"
          _hover={{
            bg: 'mycard_light_2x',
          }}
        >
          <Text>{'>'}</Text>
        </PaginationNext>
      </PaginationContainer>
    </Pagination>
  );
}

export default function Pools() {
  const allPools = useAtomValue(allPoolsAtomUnSorted);
  const _filteredPools = useAtomValue(filteredPools);
  const ITEMS_PER_PAGE = 15;
  // set sort atom declared
  const setSort = useSetAtom(sortAtom);
  // get current sort atom
  const sort = useAtomValue(sortAtom);
  // declare react states for apr,risk,tvl to manage active? states
  const [aprStatus, setAprStatus] = useState(false);
  const [riskStatus, setRiskStatus] = useState(false);
  const [tvlStatus, setTvlStatus] = useState(false);
  const { currentPage, setCurrentPage, pagesCount, pages } = usePagination({
    pagesCount: Math.floor(_filteredPools.length / ITEMS_PER_PAGE) + 1,
    initialState: { currentPage: 1 },
  });

  const pools = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return _filteredPools.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [_filteredPools, currentPage, sort]);

  // handle sort click function
  const handleSortChange = (field: string) => (order: 'asc' | 'desc') => {
    // if RISK is click
    if (field === 'RISK') {
      setRiskStatus(true);
      // check if risk exists in sort atom
      const riskIndex = sort.findIndex((s) => s.field === 'RISK');
      // if risk exist update the order else set risk with selected order
      if (riskIndex >= 0) {
        setSort((prev) => {
          const updatedSort = prev.filter((s) => s.field !== 'RISK');
          return [
            ...updatedSort,
            { field, order: sort[riskIndex].order == 'desc' ? 'asc' : 'desc' },
          ];
        });
      } else {
        setSort((prev) => {
          const updatedSort = prev.filter((s) => s.field !== field);
          return [...updatedSort, { field, order: 'asc' }];
        });
      }
    } else if (field == 'APR' || field == 'TVL') {
      // if APR or TVL is clicked clear sort atom, check if exist in sort atom if exist then set order else clear sort atom and set
      setRiskStatus(false);
      const new_sort: any = [];
      if (field == 'APR') {
        setTvlStatus(false);
        setAprStatus(true);
      }
      if (field == 'TVL') {
        setTvlStatus(true);
        setAprStatus(false);
      }
      const currentFieldIndex = sort.findIndex((s) => s.field === field);
      new_sort.push({
        field,
        order:
          sort[currentFieldIndex]?.order &&
          sort[currentFieldIndex]?.order == 'desc'
            ? 'asc'
            : 'desc',
      });
      setSort([]);
      setSort(new_sort);
    }
  };
  return (
    <Box>
      <Box
        float="left"
        width={'100%'}
        display={'flex'}
        flexDirection={'column'}
        gap={'16px'}
        padding={{ base: '0px' }}
      >
        <Box padding={'1rem 1.5rem'} bg={'mycard_dark'} borderRadius={'lg'}>
          <CombinedFilters
            paginationComponent={
              <MyPagination
                pagesCount={pagesCount}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pages={pages}
              />
            }
          />
        </Box>

        <Container width="100%" float={'left'} padding={'0px'}>
          <Table
            variant="simple"
            sx={{
              overflow: 'hidden',
              'border-collapse': 'separate',
              'border-spacing': '0px 3px',
            }}
            gap={2}
          >
            <Thead
              display={{ base: 'none', md: 'table-header-group' }}
              borderRadius="lg"
              borderColor={'white'}
            >
              <Tr color={'white'} borderRadius="12px">
                <Th
                  borderLeftRadius={'lg'}
                  borderRightWidth={'1px'}
                  borderColor={'mybg'}
                  bg={'header'}
                >
                  <Text color="white">Pool name</Text>
                </Th>
                <Th borderRightWidth={'1px'} borderColor={'mybg'} bg={'header'}>
                  <HeaderSorter
                    heading="APY"
                    align="right"
                    mainColor="white"
                    inActiveColor="text_secondary_2"
                    onClick={handleSortChange('APR')}
                    active={aprStatus}
                  />
                </Th>
                <Th borderRightWidth={'1px'} borderColor={'mybg'} bg={'header'}>
                  <HeaderSorter
                    heading="Risk"
                    align="right"
                    mainColor="white"
                    inActiveColor="text_secondary_2"
                    onClick={handleSortChange('RISK')}
                    active={riskStatus}
                  />
                </Th>
                <Th borderRightRadius={'lg'} borderColor={'mybg'} bg={'header'}>
                  <HeaderSorter
                    heading="TVL"
                    align="right"
                    mainColor="white"
                    inActiveColor="text_secondary_2"
                    onClick={handleSortChange('TVL')}
                    active={tvlStatus}
                  />
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {allPools.length > 0 && (
                <>
                  {pools.map((pool, index) => {
                    return (
                      <YieldCard
                        key={pool.pool.id}
                        pool={pool}
                        index={index}
                        showProtocolName={true}
                      />
                    );
                  })}
                </>
              )}
            </Tbody>
          </Table>
          {allPools.length > 0 && pools.length === 0 && (
            <Box padding="10px 0" width={'100%'} float={'left'}>
              <Text color="text_secondary" textAlign={'center'}>
                No pools. Check filters.
              </Text>
            </Box>
          )}
          {allPools.length === 0 && (
            <Stack>
              <Skeleton height="70px" />
              <Skeleton height="70px" />
              <Skeleton height="70px" />
            </Stack>
          )}
        </Container>
      </Box>

      <MyPagination
        pagesCount={pagesCount}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pages={pages}
      />
    </Box>
  );
}
