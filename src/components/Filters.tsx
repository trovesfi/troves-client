import { Category, PoolType } from '@/store/pools';
import {
  ALL_FILTER,
  filterAtoms,
  filters,
  updateFiltersAtom,
} from '@/store/protocols';
import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Avatar,
  Box,
  Button,
  Grid,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  TagLabel,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import mixpanel from 'mixpanel-browser';
import React, { useMemo } from 'react';

function getTextProps(isActive: boolean) {
  return {
    fontSize: '14px',
    fontWeight: isActive ? '600' : 'normal',
    color: isActive ? 'black' : 'white',
  };
}

function MyTag(
  props: {
    index: number;
    totalItems: number;
    isSelected: boolean;
    onClick: () => void;
    label: string;
  } & React.ComponentProps<typeof Tag>,
) {
  const { index, totalItems, isSelected, onClick, label, ...tagProps } = props;

  const borderRadius = useMemo(() => {
    if (index === 0) {
      return '8px 0px 0px 8px';
    } else if (index === totalItems - 1) {
      return '0px 8px 8px 0px';
    }
    return 'none';
  }, [index, totalItems]);

  return (
    <Tag
      size="md"
      padding={'12px'}
      as={'button'}
      bg={isSelected ? 'purple' : 'mycard_light'}
      color={'white'}
      borderRadius={borderRadius}
      display={'flex'}
      justifyContent={'center'}
      _hover={{
        bg: isSelected ? 'purple_hover_2' : 'mycard_light_2x',
        '& > *': {
          fontWeight: '600',
        },
      }}
      onClick={() => {
        onClick();
      }}
    >
      <TagLabel {...getTextProps(isSelected)}>{label}</TagLabel>
    </Tag>
  );
}

// Helper function to check if any filter is active
function hasAnyFilterActive(
  protocolsFilter: string[],
  categoriesFilter: string[],
  riskLevelFilters: string[],
  poolTypeFilters: string[],
) {
  return (
    !protocolsFilter.includes(ALL_FILTER) ||
    !categoriesFilter.includes(ALL_FILTER) ||
    !riskLevelFilters.includes(ALL_FILTER) ||
    !poolTypeFilters.includes(ALL_FILTER)
  );
}

// Helper function to get total selected count across all filters
function getTotalSelectedCount(
  protocolsFilter: string[],
  categoriesFilter: string[],
  riskLevelFilters: string[],
  poolTypeFilters: string[],
) {
  let count = 0;

  // Protocols count
  if (protocolsFilter.includes(ALL_FILTER)) {
    count += filters.protocols.length;
  } else {
    count += protocolsFilter.length;
  }

  // Categories count
  if (categoriesFilter.includes(ALL_FILTER)) {
    count += filters.categories.length;
  } else {
    count += categoriesFilter.length;
  }

  // Risk levels count
  if (riskLevelFilters.includes(ALL_FILTER)) {
    count += 5; // Assuming 5 risk levels (1-5)
  } else {
    count += riskLevelFilters.length;
  }

  // Pool types count
  if (poolTypeFilters.includes(ALL_FILTER)) {
    count += filters.types.length;
  } else {
    count += poolTypeFilters.length;
  }

  return count;
}

export function ProtocolFilters() {
  const protocolsFilter = useAtomValue(filterAtoms.protocolsAtom);

  function isProtocolSelected(protocolName: string) {
    return (
      protocolsFilter.includes(ALL_FILTER) ||
      protocolsFilter.includes(protocolName)
    );
  }

  function atleastOneProtocolSelected() {
    return (
      protocolsFilter.includes(ALL_FILTER) ||
      (protocolsFilter.length > 0 && !protocolsFilter.includes(ALL_FILTER))
    );
  }

  function getSelectedProtocolsCount() {
    if (protocolsFilter.includes(ALL_FILTER)) {
      return filters.protocols.length;
    }
    return protocolsFilter.length;
  }

  const updateFilters = useSetAtom(updateFiltersAtom);

  return (
    <Box
      width={'100%'}
      display={'flex'}
      gap={{ base: '10px' }}
      flexDirection={{ base: 'row' }}
      justifyContent={'space-between'}
    >
      <Grid
        display={{ base: 'none', md: 'grid' }}
        templateColumns={{
          base: 'repeat(auto-fit, minmax(40px, 1fr))',
          md: `repeat(${filters.protocols.length}, 52px)`,
        }}
        gap={0.5}
        width={{ base: '100%', md: 'auto' }}
      >
        {filters.protocols
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((p, index) => {
            const isSelected =
              isProtocolSelected(p.name) &&
              !protocolsFilter.includes(ALL_FILTER);
            return (
              <Tag
                key={p.name}
                as="button"
                alignItems={'center'}
                justifyContent={'center'}
                size={{ base: 'md', md: 'lg' }}
                padding={{ base: '3px', md: '5px' }}
                bg={isSelected ? 'purple' : 'mycard_light'}
                borderRadius={
                  index === 0
                    ? '8px 0 0 8px'
                    : index === filters.protocols.length - 1
                      ? '0 8px 8px 0'
                      : 'none'
                }
                _hover={{
                  bg: isSelected ? 'purple_hover_2' : 'mycard_light_2x',
                }}
                onClick={() => {
                  const selectedProtocols = protocolsFilter.includes(ALL_FILTER)
                    ? []
                    : protocolsFilter;

                  let updatedProtocols = [];
                  if (selectedProtocols.includes(p.name)) {
                    updatedProtocols = selectedProtocols.filter(
                      (x) => x !== p.name,
                    );
                  } else {
                    updatedProtocols = [...selectedProtocols, p.name];
                  }
                  if (updatedProtocols.length === filters.protocols.length) {
                    updatedProtocols = [ALL_FILTER];
                  }
                  mixpanel.track('Protocol Filter', {
                    protocol: p.name,
                    selected:
                      updatedProtocols.includes(p.name) ||
                      updatedProtocols.includes(ALL_FILTER),
                    updatedProtocols: JSON.stringify(updatedProtocols),
                  });
                  updateFilters('protocols', updatedProtocols);
                }}
              >
                <Tooltip label={p.name}>
                  <Avatar
                    src={`${p.logo}`}
                    border={'1px solid var(--chakra-colors-bg)'}
                    size="sm"
                    name={p.name}
                    filter={
                      isProtocolSelected(p.name)
                        ? 'none'
                        : 'grayscale(100%) sepia(20%) hue-rotate(210deg) brightness(1.2) invert(0.2)'
                    }
                  />
                </Tooltip>
              </Tag>
            );
          })}
      </Grid>

      {/* Mobile dropdown for protocol filters */}
      <Menu>
        <MenuButton
          width={{ base: '100%' }}
          as={Button}
          rightIcon={<ChevronDownIcon />}
          display={{ base: 'flex', md: 'none' }}
          bg="mycard_light"
          color="white"
          borderRadius="md"
          padding="12px"
          fontSize="14px"
          fontWeight="normal"
          size="lg"
          _hover={{
            bg: 'mycard_light_2x',
            '& > *': {
              color: 'black',
            },
          }}
        >
          <HStack spacing={2}>
            <Text>Protocols</Text>
            <Text
              bg="purple"
              color="white"
              padding="4px"
              borderRadius="4px"
              fontSize="10px"
            >
              {getSelectedProtocolsCount()}
            </Text>
          </HStack>
        </MenuButton>
        <MenuList bg="mycard_light" borderColor="mycard">
          {filters.protocols.map((p) => (
            <MenuItem
              key={p.name}
              bg={isProtocolSelected(p.name) ? 'purple' : 'mycard_light'}
              color={is