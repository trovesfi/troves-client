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
              color={isProtocolSelected(p.name) ? 'black' : 'text_primary'}
              _hover={{
                bg: 'mycard_light_2x',
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
              <HStack spacing={3}>
                <Avatar
                  src={`${p.logo}`}
                  border="1px solid var(--chakra-colors-bg)"
                  size="sm"
                  name={p.name}
                  filter={
                    isProtocolSelected(p.name)
                      ? 'none'
                      : 'grayscale(100%) sepia(20%) hue-rotate(210deg) brightness(1.2) invert(0.2)'
                  }
                />
                <Text>{p.name}</Text>
              </HStack>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
}

export function CategoryFilters() {
  const updateFilters = useSetAtom(updateFiltersAtom);
  const protocolFilters = useAtomValue(filterAtoms.protocolsAtom);
  const categoriesFilter = useAtomValue(filterAtoms.categoriesAtom);
  const riskLevelFilters = useAtomValue(filterAtoms.riskAtom);
  const poolTypeFilters = useAtomValue(filterAtoms.typesAtom);

  function updateCategory(category: Category) {
    const existingCategories = categoriesFilter.includes(ALL_FILTER)
      ? []
      : categoriesFilter;
    let isCategoryAdded = false;
    console.log('filter34', 'categories', existingCategories);
    if (existingCategories.includes(category)) {
      const newFilters = existingCategories.filter(
        (x) => x !== category.valueOf(),
      );
      updateFilters(
        'categories',
        newFilters.length === 0 ? [ALL_FILTER] : newFilters,
      );
    } else {
      updateFilters('categories', [...existingCategories, category.valueOf()]);
      isCategoryAdded = true;
    }
    mixpanel.track('Category Filter', {
      category: category.valueOf(),
      selected: isCategoryAdded,
    });
  }

  function updateRiskLevel(riskLevels: string[], riskLevel = 'low') {
    let existingRiskLevels = riskLevelFilters.includes(ALL_FILTER)
      ? []
      : riskLevelFilters;

    let isSelected = false;
    console.log('filter34', 'riskLevels', existingRiskLevels);
    riskLevels.map((riskLevel) => {
      if (existingRiskLevels.includes(riskLevel)) {
        const newFilters = existingRiskLevels.filter((x) => x !== riskLevel);
        existingRiskLevels =
          newFilters.length === 0 ? [ALL_FILTER] : newFilters;
        updateFilters('risk', existingRiskLevels);
      } else {
        existingRiskLevels = [...existingRiskLevels, riskLevel];
        isSelected = true;
        updateFilters('risk', existingRiskLevels);
      }
    });

    mixpanel.track('Risk Filter', {
      riskLevel,
      selected: isSelected,
    });
  }

  function updatePoolType(types: PoolType[], name: string) {
    let existingPoolTypes = poolTypeFilters.includes(ALL_FILTER)
      ? []
      : poolTypeFilters;
    console.log('filter34', 'poolType', existingPoolTypes);
    let isSelected = false;
    types.map((type) => {
      if (existingPoolTypes.includes(type.valueOf())) {
        const newFilters = existingPoolTypes.filter(
          (x) => x !== type.valueOf(),
        );
        existingPoolTypes = newFilters.length === 0 ? [ALL_FILTER] : newFilters;
        updateFilters('poolTypes', existingPoolTypes);
      } else {
        existingPoolTypes = [...existingPoolTypes, type.valueOf()];
        isSelected = true;
        updateFilters('poolTypes', existingPoolTypes);
      }
    });
    mixpanel.track('Pool Type Filter', {
      poolType: name,
      selected: isSelected,
    });
  }

  function isLowRisk() {
    return riskLevelFilters.includes('1') || riskLevelFilters.includes('2');
  }

  return (
    <Box width={'100%'} display={'flex'} justifyContent={'space-between'}>
      {/* Desktop category filters */}
      <Box width={'100%'} display={{ base: 'none', md: 'flex' }} gap={'28px'}>
        <Grid templateColumns={'repeat(4, 1fr)'} gap={0.5}>
          {/* Stable pools */}
          <MyTag
            index={0}
            totalItems={4}
            isSelected={categoriesFilter.includes(Category.Stable.valueOf())}
            onClick={() => updateCategory(Category.Stable)}
            label={Category.Stable.valueOf().split(' ')[0]}
          />
          {/* STRK pools */}
          <MyTag
            index={1}
            totalItems={4}
            isSelected={categoriesFilter.includes(Category.STRK.valueOf())}
            onClick={() => updateCategory(Category.STRK)}
            label={Category.STRK.valueOf().split(' ')[0]}
          />

          {/* ETH pools */}
          <MyTag
            index={2}
            totalItems={4}
            isSelected={categoriesFilter.includes(Category.ETH.valueOf())}
            onClick={() => updateCategory(Category.ETH)}
            label={Category.ETH.valueOf().split(' ')[0]}
          />

          {/* Low risk pools */}
          <MyTag
            index={3}
            totalItems={4}
            isSelected={isLowRisk()}
            onClick={() => updateRiskLevel(['1', '2'])}
            label="Low risk"
          />
        </Grid>

        <Grid templateColumns={'repeat(3, 1fr)'} gap={0.5}>
          {/* DEXes */}
          <MyTag
            index={0}
            totalItems={3}
            isSelected={
              poolTypeFilters.includes(PoolType.DEXV2.valueOf()) ||
              poolTypeFilters.includes(PoolType.DEXV3.valueOf())
            }
            onClick={() =>
              updatePoolType([PoolType.DEXV2, PoolType.DEXV3], 'DEX')
            }
            label="DEX"
          />
          {/* Lending */}
          <MyTag
            index={1}
            totalItems={3}
            isSelected={poolTypeFilters.includes(PoolType.Lending.valueOf())}
            onClick={() => updatePoolType([PoolType.Lending], 'Lending')}
            label="Lending"
          />
          {/* Derivatives */}
          <MyTag
            index={2}
            totalItems={3}
            isSelected={poolTypeFilters.includes(
              PoolType.Derivatives.valueOf(),
            )}
            onClick={() =>
              updatePoolType([PoolType.Derivatives], 'Derivatives')
            }
            label="Derivatives"
          />
        </Grid>
      </Box>

      <Box
        width={'100%'}
        display={{ base: 'flex', md: 'none' }}
        justifyContent={'space-between'}
        gap={'10px'}
      >
        <Menu>
          <MenuButton
            width={'100%'}
            as={Button}
            rightIcon={<ChevronDownIcon />}
            bg="mycard_light"
            color="white"
            borderRadius="md"
            padding="12px"
            size="lg"
            fontSize="14px"
            fontWeight="normal"
            _hover={{
              bg: 'mycard_light_2x',
              '& > *': {
                color: 'black',
              },
            }}
          >
            <Text>Categories</Text>
          </MenuButton>
          <MenuList bg="mycard_light" borderColor="mycard">
            {[Category.Stable, Category.STRK, Category.ETH].map((category) => (
              <MenuItem
                key={category.valueOf()}
                bg="mycard_light"
                color="white"
                _hover={{
                  bg: 'mycard_light_2x',
                }}
                onClick={() => updateCategory(category)}
              >
                <HStack spacing={3}>
                  <Text>{category.valueOf().split(' ')[0]}</Text>
                  {categoriesFilter.includes(category.valueOf()) && (
                    <Text color="purple" fontSize="12px">
                      ✓
                    </Text>
                  )}
                </HStack>
              </MenuItem>
            ))}
            <MenuItem
              bg="mycard_light"
              color="white"
              _hover={{
                bg: 'mycard_light_2x',
                color: 'black',
              }}
            >
              <HStack spacing={3}>
                <Text>Low risk</Text>
                {isLowRisk() && (
                  <Text color="purple" fontSize="12px">
                    ✓
                  </Text>
                )}
              </HStack>
            </MenuItem>
          </MenuList>
        </Menu>

        <Menu>
          <MenuButton
            width={'100%'}
            as={Button}
            rightIcon={<ChevronDownIcon />}
            bg="mycard_light"
            color="white"
            borderRadius="md"
            padding="12px"
            size="lg"
            fontSize="14px"
            fontWeight="normal"
            _hover={{
              bg: 'mycard_light_2x',
              '& > *': {
                color: 'black',
              },
            }}
          >
            <Text>Pool Types</Text>
          </MenuButton>
          <MenuList bg="mycard_light" borderColor="mycard">
            <MenuItem
              bg="mycard_light"
              color="white"
              _hover={{
                bg: 'mycard_light_2x',
              }}
              onClick={() =>
                updatePoolType([PoolType.DEXV2, PoolType.DEXV3], 'DEX')
              }
            >
              <HStack spacing={3}>
                <Text>DEX</Text>
                {(poolTypeFilters.includes(PoolType.DEXV2.valueOf()) ||
                  poolTypeFilters.includes(PoolType.DEXV3.valueOf())) && (
                  <Text color="purple" fontSize="12px">
                    ✓
                  </Text>
                )}
              </HStack>
            </MenuItem>
            <MenuItem
              bg="mycard_light"
              color="white"
              _hover={{
                bg: 'mycard_light_2x',
              }}
              onClick={() => updatePoolType([PoolType.Lending], 'Lending')}
            >
              <HStack spacing={3}>
                <Text>Lending</Text>
                {poolTypeFilters.includes(PoolType.Lending) && (
                  <Text color="purple" fontSize="12px">
                    ✓
                  </Text>
                )}
              </HStack>
            </MenuItem>
            <MenuItem
              bg="mycard_light"
              color="white"
              _hover={{
                bg: 'mycard_light_2x',
              }}
              onClick={() =>
                updatePoolType([PoolType.Derivatives], 'Derivatives')
              }
            >
              <HStack spacing={3}>
                <Text>Derivative</Text>
                {poolTypeFilters.includes(PoolType.Derivatives) && (
                  <Text color="purple" fontSize="12px">
                    ✓
                  </Text>
                )}
              </HStack>
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </Box>
  );
}

export function CombinedFilters({
  paginationComponent,
}: {
  paginationComponent?: React.ReactNode;
}) {
  const updateFilters = useSetAtom(updateFiltersAtom);
  const protocolsFilter = useAtomValue(filterAtoms.protocolsAtom);
  const categoriesFilter = useAtomValue(filterAtoms.categoriesAtom);
  const riskLevelFilters = useAtomValue(filterAtoms.riskAtom);
  const poolTypeFilters = useAtomValue(filterAtoms.typesAtom);

  const hasAnyFilter = hasAnyFilterActive(
    protocolsFilter,
    categoriesFilter,
    riskLevelFilters,
    poolTypeFilters,
  );

  const totalSelectedCount = getTotalSelectedCount(
    protocolsFilter,
    categoriesFilter,
    riskLevelFilters,
    poolTypeFilters,
  );

  const handleCombinedFilterToggle = () => {
    if (hasAnyFilter) {
      updateFilters('protocols', [ALL_FILTER]);
      updateFilters('categories', [ALL_FILTER]);
      updateFilters('risk', [ALL_FILTER]);
      updateFilters('poolTypes', [ALL_FILTER]);
      mixpanel.track('Clear all filters');
    } else {
      updateFilters('protocols', []);
      updateFilters('categories', []);
      updateFilters('risk', []);
      updateFilters('poolTypes', []);
      mixpanel.track('Select all filters');
    }
  };

  return (
    <Box width="100%">
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
                (protocolsFilter.includes(ALL_FILTER) ||
                  protocolsFilter.includes(p.name)) &&
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
                    const selectedProtocols = protocolsFilter.includes(
                      ALL_FILTER,
                    )
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
                        protocolsFilter.includes(ALL_FILTER) ||
                        protocolsFilter.includes(p.name)
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
                {protocolsFilter.includes(ALL_FILTER)
                  ? filters.protocols.length
                  : protocolsFilter.length}
              </Text>
            </HStack>
          </MenuButton>
          <MenuList bg="mycard_light" borderColor="mycard">
            {filters.protocols.map((p) => (
              <MenuItem
                key={p.name}
                bg={
                  protocolsFilter.includes(ALL_FILTER) ||
                  protocolsFilter.includes(p.name)
                    ? 'purple'
                    : 'mycard_light'
                }
                color={
                  protocolsFilter.includes(ALL_FILTER) ||
                  protocolsFilter.includes(p.name)
                    ? 'black'
                    : 'text_primary'
                }
                _hover={{
                  bg: 'mycard_light_2x',
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
                <HStack spacing={3}>
                  <Avatar
                    src={`${p.logo}`}
                    border="1px solid var(--chakra-colors-bg)"
                    size="sm"
                    name={p.name}
                    filter={
                      protocolsFilter.includes(ALL_FILTER) ||
                      protocolsFilter.includes(p.name)
                        ? 'none'
                        : 'grayscale(100%) sepia(20%) hue-rotate(210deg) brightness(1.2) invert(0.2)'
                    }
                  />
                  <Text>{p.name}</Text>
                </HStack>
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        <Tag
          display={'flex'}
          width={{ base: '100%', md: 'auto' }}
          gap={'10px'}
          size="lg"
          borderRadius="md"
          padding={'12px'}
          fontSize={'14px'}
          fontWeight={'normal'}
          bg={'mycard_light'}
          color={'white'}
          as="button"
          marginTop={'1px'}
          aria-label={hasAnyFilter ? 'Clear all filters' : 'Select all filters'}
          _hover={{
            bg: 'mycard_light_2x',
            '& > *': {
              color: 'white',
            },
          }}
          onClick={handleCombinedFilterToggle}
        >
          <Text
            bg={'purple'}
            color={'black'}
            padding={'4px'}
            borderRadius={'4px'}
            fontSize={'10px'}
          >
            {totalSelectedCount}
          </Text>
          <Text>{hasAnyFilter ? 'Clear filters' : 'Select all'}</Text>
        </Tag>
      </Box>

      <Box
        width={'100%'}
        display={'flex'}
        flexDirection={{ base: 'column', md: 'row' }}
        justifyContent={'space-between'}
        marginTop={'10px'}
      >
        <Box
          width={{ base: '100%', md: '70%' }}
          display={{ base: 'none', md: 'flex' }}
          gap={'28px'}
        >
          <Grid templateColumns={'repeat(4, 1fr)'} gap={0.5}>
            <MyTag
              index={0}
              totalItems={4}
              isSelected={categoriesFilter.includes(Category.Stable.valueOf())}
              onClick={() => {
                const existingCategories = categoriesFilter.includes(ALL_FILTER)
                  ? []
                  : categoriesFilter;
                let isCategoryAdded = false;
                if (existingCategories.includes(Category.Stable)) {
                  const newFilters = existingCategories.filter(
                    (x) => x !== Category.Stable.valueOf(),
                  );
                  updateFilters(
                    'categories',
                    newFilters.length === 0 ? [ALL_FILTER] : newFilters,
                  );
                } else {
                  updateFilters('categories', [
                    ...existingCategories,
                    Category.Stable.valueOf(),
                  ]);
                  isCategoryAdded = true;
                }
                mixpanel.track('Category Filter', {
                  category: Category.Stable.valueOf(),
                  selected: isCategoryAdded,
                });
              }}
              label={Category.Stable.valueOf().split(' ')[0]}
            />
            {/* STRK pools */}
            <MyTag
              index={1}
              totalItems={4}
              isSelected={categoriesFilter.includes(Category.STRK.valueOf())}
              onClick={() => {
                const existingCategories = categoriesFilter.includes(ALL_FILTER)
                  ? []
                  : categoriesFilter;
                let isCategoryAdded = false;
                if (existingCategories.includes(Category.STRK)) {
                  const newFilters = existingCategories.filter(
                    (x) => x !== Category.STRK.valueOf(),
                  );
                  updateFilters(
                    'categories',
                    newFilters.length === 0 ? [ALL_FILTER] : newFilters,
                  );
                } else {
                  updateFilters('categories', [
                    ...existingCategories,
                    Category.STRK.valueOf(),
                  ]);
                  isCategoryAdded = true;
                }
                mixpanel.track('Category Filter', {
                  category: Category.STRK.valueOf(),
                  selected: isCategoryAdded,
                });
              }}
              label={Category.STRK.valueOf().split(' ')[0]}
            />

            <MyTag
              index={2}
              totalItems={4}
              isSelected={categoriesFilter.includes(Category.ETH.valueOf())}
              onClick={() => {
                const existingCategories = categoriesFilter.includes(ALL_FILTER)
                  ? []
                  : categoriesFilter;
                let isCategoryAdded = false;
                if (existingCategories.includes(Category.ETH)) {
                  const newFilters = existingCategories.filter(
                    (x) => x !== Category.ETH.valueOf(),
                  );
                  updateFilters(
                    'categories',
                    newFilters.length === 0 ? [ALL_FILTER] : newFilters,
                  );
                } else {
                  updateFilters('categories', [
                    ...existingCategories,
                    Category.ETH.valueOf(),
                  ]);
                  isCategoryAdded = true;
                }
                mixpanel.track('Category Filter', {
                  category: Category.ETH.valueOf(),
                  selected: isCategoryAdded,
                });
              }}
              label={Category.ETH.valueOf().split(' ')[0]}
            />

            <MyTag
              index={3}
              totalItems={4}
              isSelected={
                riskLevelFilters.includes('1') || riskLevelFilters.includes('2')
              }
              onClick={() => {
                let existingRiskLevels = riskLevelFilters.includes(ALL_FILTER)
                  ? []
                  : riskLevelFilters;

                let isSelected = false;
                ['1', '2'].map((riskLevel) => {
                  if (existingRiskLevels.includes(riskLevel)) {
                    const newFilters = existingRiskLevels.filter(
                      (x) => x !== riskLevel,
                    );
                    existingRiskLevels =
                      newFilters.length === 0 ? [ALL_FILTER] : newFilters;
                    updateFilters('risk', existingRiskLevels);
                  } else {
                    existingRiskLevels = [...existingRiskLevels, riskLevel];
                    isSelected = true;
                    updateFilters('risk', existingRiskLevels);
                  }
                });

                mixpanel.track('Risk Filter', {
                  riskLevel: 'low',
                  selected: isSelected,
                });
              }}
              label="Low risk"
            />
          </Grid>

          <Grid templateColumns={'repeat(3, 1fr)'} gap={0.5}>
            <MyTag
              index={0}
              totalItems={3}
              isSelected={
                poolTypeFilters.includes(PoolType.DEXV2.valueOf()) ||
                poolTypeFilters.includes(PoolType.DEXV3.valueOf())
              }
              onClick={() => {
                let existingPoolTypes = poolTypeFilters.includes(ALL_FILTER)
                  ? []
                  : poolTypeFilters;
                let isSelected = false;
                [PoolType.DEXV2, PoolType.DEXV3].map((type) => {
                  if (existingPoolTypes.includes(type.valueOf())) {
                    const newFilters = existingPoolTypes.filter(
                      (x) => x !== type.valueOf(),
                    );
                    existingPoolTypes =
                      newFilters.length === 0 ? [ALL_FILTER] : newFilters;
                    updateFilters('poolTypes', existingPoolTypes);
                  } else {
                    existingPoolTypes = [...existingPoolTypes, type.valueOf()];
                    isSelected = true;
                    updateFilters('poolTypes', existingPoolTypes);
                  }
                });
                mixpanel.track('Pool Type Filter', {
                  poolType: 'DEX',
                  selected: isSelected,
                });
              }}
              label="DEX"
            />
            <MyTag
              index={1}
              totalItems={3}
              isSelected={poolTypeFilters.includes(PoolType.Lending.valueOf())}
              onClick={() => {
                let existingPoolTypes = poolTypeFilters.includes(ALL_FILTER)
                  ? []
                  : poolTypeFilters;
                let isSelected = false;
                [PoolType.Lending].map((type) => {
                  if (existingPoolTypes.includes(type.valueOf())) {
                    const newFilters = existingPoolTypes.filter(
                      (x) => x !== type.valueOf(),
                    );
                    existingPoolTypes =
                      newFilters.length === 0 ? [ALL_FILTER] : newFilters;
                    updateFilters('poolTypes', existingPoolTypes);
                  } else {
                    existingPoolTypes = [...existingPoolTypes, type.valueOf()];
                    isSelected = true;
                    updateFilters('poolTypes', existingPoolTypes);
                  }
                });
                mixpanel.track('Pool Type Filter', {
                  poolType: 'Lending',
                  selected: isSelected,
                });
              }}
              label="Lending"
            />
            <MyTag
              index={2}
              totalItems={3}
              isSelected={poolTypeFilters.includes(
                PoolType.Derivatives.valueOf(),
              )}
              onClick={() => {
                let existingPoolTypes = poolTypeFilters.includes(ALL_FILTER)
                  ? []
                  : poolTypeFilters;
                let isSelected = false;
                [PoolType.Derivatives].map((type) => {
                  if (existingPoolTypes.includes(type.valueOf())) {
                    const newFilters = existingPoolTypes.filter(
                      (x) => x !== type.valueOf(),
                    );
                    existingPoolTypes =
                      newFilters.length === 0 ? [ALL_FILTER] : newFilters;
                    updateFilters('poolTypes', existingPoolTypes);
                  } else {
                    existingPoolTypes = [...existingPoolTypes, type.valueOf()];
                    isSelected = true;
                    updateFilters('poolTypes', existingPoolTypes);
                  }
                });
                mixpanel.track('Pool Type Filter', {
                  poolType: 'Derivatives',
                  selected: isSelected,
                });
              }}
              label="Derivatives"
            />
          </Grid>
        </Box>

        {paginationComponent && (
          <Box
            width={{ base: '100%', md: '30%' }}
            display="flex"
            justifyContent="flex-end"
          >
            {paginationComponent}
          </Box>
        )}

        <Box
          width={'100%'}
          display={{ base: 'flex', md: 'none' }}
          justifyContent={'space-between'}
          gap={'10px'}
          mt={'0.8rem'}
        >
          <Menu>
            <MenuButton
              width={'100%'}
              as={Button}
              rightIcon={<ChevronDownIcon />}
              bg="mycard_light"
              color="white"
              borderRadius="md"
              padding="12px"
              size="lg"
              fontSize="14px"
              fontWeight="normal"
              _hover={{
                bg: 'mycard_light_2x',
                '& > *': {
                  color: 'black',
                },
              }}
            >
              <Text>Categories</Text>
            </MenuButton>
            <MenuList bg="mycard_light" borderColor="mycard">
              {[Category.Stable, Category.STRK, Category.ETH].map(
                (category) => (
                  <MenuItem
                    key={category.valueOf()}
                    bg="mycard_light"
                    color="white"
                    _hover={{
                      bg: 'mycard_light_2x',
                    }}
                    onClick={() => {
                      const existingCategories = categoriesFilter.includes(
                        ALL_FILTER,
                      )
                        ? []
                        : categoriesFilter;
                      let isCategoryAdded = false;
                      if (existingCategories.includes(category)) {
                        const newFilters = existingCategories.filter(
                          (x) => x !== category.valueOf(),
                        );
                        updateFilters(
                          'categories',
                          newFilters.length === 0 ? [ALL_FILTER] : newFilters,
                        );
                      } else {
                        updateFilters('categories', [
                          ...existingCategories,
                          category.valueOf(),
                        ]);
                        isCategoryAdded = true;
                      }
                      mixpanel.track('Category Filter', {
                        category: category.valueOf(),
                        selected: isCategoryAdded,
                      });
                    }}
                  >
                    <HStack spacing={3}>
                      <Text>{category.valueOf().split(' ')[0]}</Text>
                      {categoriesFilter.includes(category.valueOf()) && (
                        <Text color="purple" fontSize="12px">
                          ✓
                        </Text>
                      )}
                    </HStack>
                  </MenuItem>
                ),
              )}
              <MenuItem
                bg="mycard_light"
                color="white"
                _hover={{
                  bg: 'mycard_light_2x',
                  color: 'black',
                }}
                onClick={() => {
                  let existingRiskLevels = riskLevelFilters.includes(ALL_FILTER)
                    ? []
                    : riskLevelFilters;

                  let isSelected = false;
                  ['1', '2'].map((riskLevel) => {
                    if (existingRiskLevels.includes(riskLevel)) {
                      const newFilters = existingRiskLevels.filter(
                        (x) => x !== riskLevel,
                      );
                      existingRiskLevels =
                        newFilters.length === 0 ? [ALL_FILTER] : newFilters;
                      updateFilters('risk', existingRiskLevels);
                    } else {
                      existingRiskLevels = [...existingRiskLevels, riskLevel];
                      isSelected = true;
                      updateFilters('risk', existingRiskLevels);
                    }
                  });

                  mixpanel.track('Risk Filter', {
                    riskLevel: 'low',
                    selected: isSelected,
                  });
                }}
              >
                <HStack spacing={3}>
                  <Text>Low risk</Text>
                  {(riskLevelFilters.includes('1') ||
                    riskLevelFilters.includes('2')) && (
                    <Text color="purple" fontSize="12px">
                      ✓
                    </Text>
                  )}
                </HStack>
              </MenuItem>
            </MenuList>
          </Menu>

          <Menu>
            <MenuButton
              width={'100%'}
              as={Button}
              rightIcon={<ChevronDownIcon />}
              bg="mycard_light"
              color="white"
              borderRadius="md"
              padding="12px"
              size="lg"
              fontSize="14px"
              fontWeight="normal"
              _hover={{
                bg: 'mycard_light_2x',
                '& > *': {
                  color: 'black',
                },
              }}
            >
              <Text>Pool Types</Text>
            </MenuButton>
            <MenuList bg="mycard_light" borderColor="mycard">
              <MenuItem
                bg="mycard_light"
                color="white"
                _hover={{
                  bg: 'mycard_light_2x',
                }}
                onClick={() => {
                  let existingPoolTypes = poolTypeFilters.includes(ALL_FILTER)
                    ? []
                    : poolTypeFilters;
                  let isSelected = false;
                  [PoolType.DEXV2, PoolType.DEXV3].map((type) => {
                    if (existingPoolTypes.includes(type.valueOf())) {
                      const newFilters = existingPoolTypes.filter(
                        (x) => x !== type.valueOf(),
                      );
                      existingPoolTypes =
                        newFilters.length === 0 ? [ALL_FILTER] : newFilters;
                      updateFilters('poolTypes', existingPoolTypes);
                    } else {
                      existingPoolTypes = [
                        ...existingPoolTypes,
                        type.valueOf(),
                      ];
                      isSelected = true;
                      updateFilters('poolTypes', existingPoolTypes);
                    }
                  });
                  mixpanel.track('Pool Type Filter', {
                    poolType: 'DEX',
                    selected: isSelected,
                  });
                }}
              >
                <HStack spacing={3}>
                  <Text>DEX</Text>
                  {(poolTypeFilters.includes(PoolType.DEXV2.valueOf()) ||
                    poolTypeFilters.includes(PoolType.DEXV3.valueOf())) && (
                    <Text color="purple" fontSize="12px">
                      ✓
                    </Text>
                  )}
                </HStack>
              </MenuItem>
              <MenuItem
                bg="mycard_light"
                color="white"
                _hover={{
                  bg: 'mycard_light_2x',
                }}
                onClick={() => {
                  let existingPoolTypes = poolTypeFilters.includes(ALL_FILTER)
                    ? []
                    : poolTypeFilters;
                  let isSelected = false;
                  [PoolType.Lending].map((type) => {
                    if (existingPoolTypes.includes(type.valueOf())) {
                      const newFilters = existingPoolTypes.filter(
                        (x) => x !== type.valueOf(),
                      );
                      existingPoolTypes =
                        newFilters.length === 0 ? [ALL_FILTER] : newFilters;
                      updateFilters('poolTypes', existingPoolTypes);
                    } else {
                      existingPoolTypes = [
                        ...existingPoolTypes,
                        type.valueOf(),
                      ];
                      isSelected = true;
                      updateFilters('poolTypes', existingPoolTypes);
                    }
                  });
                  mixpanel.track('Pool Type Filter', {
                    poolType: 'Lending',
                    selected: isSelected,
                  });
                }}
              >
                <HStack spacing={3}>
                  <Text>Lending</Text>
                  {poolTypeFilters.includes(PoolType.Lending) && (
                    <Text color="purple" fontSize="12px">
                      ✓
                    </Text>
                  )}
                </HStack>
              </MenuItem>
              <MenuItem
                bg="mycard_light"
                color="white"
                _hover={{
                  bg: 'mycard_light_2x',
                }}
                onClick={() => {
                  let existingPoolTypes = poolTypeFilters.includes(ALL_FILTER)
                    ? []
                    : poolTypeFilters;
                  let isSelected = false;
                  [PoolType.Derivatives].map((type) => {
                    if (existingPoolTypes.includes(type.valueOf())) {
                      const newFilters = existingPoolTypes.filter(
                        (x) => x !== type.valueOf(),
                      );
                      existingPoolTypes =
                        newFilters.length === 0 ? [ALL_FILTER] : newFilters;
                      updateFilters('poolTypes', existingPoolTypes);
                    } else {
                      existingPoolTypes = [
                        ...existingPoolTypes,
                        type.valueOf(),
                      ];
                      isSelected = true;
                      updateFilters('poolTypes', existingPoolTypes);
                    }
                  });
                  mixpanel.track('Pool Type Filter', {
                    poolType: 'Derivatives',
                    selected: isSelected,
                  });
                }}
              >
                <HStack spacing={3}>
                  <Text>Derivative</Text>
                  {poolTypeFilters.includes(PoolType.Derivatives) && (
                    <Text color="purple" fontSize="12px">
                      ✓
                    </Text>
                  )}
                </HStack>
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
}
