'use client';

import { useDotButton } from '@/components/EmblaCarouselDotButton';
import Pools from '@/components/Pools';
import Strategies from '@/components/Strategies';
import TVL from '@/components/TVL';
import { useWindowSize } from '@/utils/useWindowSize';

import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  TabIndicator,
  Text,
} from '@chakra-ui/react';
import { useAccount } from '@starknet-react/core';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import mixpanel from 'mixpanel-browser';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const banner_images = [
  // {
  //   desktop: '/banners/strkfarm_braavos.svg',
  //   mobile: '/banners/strkfarm_braavos_mobile.svg',
  //   link: 'https://starknet.quest/quest/235',
  // },
  {
    desktop: '/banners/endur.svg',
    mobile: '/banners/endur_mobile.svg',
    link: 'https://endur.fi/r/troves',
  },
  {
    desktop: '/banners/seed_grant.svg',
    mobile: '/banners/seed_grant_small.jpg',
    link: 'https://x.com/troves/status/1787783906982260881',
  },
];

export default function Home() {
  const [tabIndex, setTabIndex] = useState(0);

  const { address } = useAccount();
  const searchParams = useSearchParams();
  const size = useWindowSize();
  const router = useRouter();

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
    },
    [Autoplay({ playOnInit: true, delay: 8000 })],
  );

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  function setRoute(value: string) {
    router.push(`?tab=${value}`);
  }

  function handleTabsChange(index: number) {
    if (index === 1) {
      setRoute('pools');
    } else {
      setRoute('strategies');
    }
  }

  useEffect(() => {
    mixpanel.track('Page open');
  }, []);

  useEffect(() => {
    (async () => {
      const tab = searchParams.get('tab');
      if (tab === 'pools') {
        setTabIndex(1);
      } else {
        setTabIndex(0);
      }
    })();
  }, [searchParams]);

  return (
    <Container
      maxWidth={'1152px'}
      margin={'0 auto'}
      padding={{ base: '15px 10px' }}
    >
      <Box
        padding={{ base: '0px 15px 15px' }}
        borderRadius="10px"
        margin={{ base: '0', md: '20px 0px 10px' }}
      >
        <Text
          // color={'banner_text_gradient'}
          fontSize={{ base: '25px', md: '35px' }}
          lineHeight={{ base: '30px', md: '30px' }}
          marginBottom={'10px'}
          textAlign={'center'}
        >
          <b className="theme-gradient-text">
            Starknet&apos;s Yield Powerhouse
          </b>
          🚀
        </Text>
        <Text
          color="text_secondary"
          textAlign={'center'}
          fontSize={{ base: '15px', md: '18px' }}
          lineHeight={{ base: '20px', md: '20px' }}
          margin={{ base: '0 auto', md: '0' }}
          maxWidth={{ base: '80%', md: '100%' }}
        >
          Discover and invest in custom-built yield strategies.
        </Text>
      </Box>

      <TVL />

      <Tabs
        position="relative"
        variant="unstyled"
        width={'100%'}
        index={tabIndex}
        onChange={handleTabsChange}
        marginTop={'10px'}
        padding={0}
      >
        <TabList borderBottom={'2px solid var(--chakra-colors-mycard)'}>
          <Tab
            color={'text_secondary'}
            _selected={{ color: 'purple', fontWeight: 'bold' }}
            onClick={() => {
              mixpanel.track('Strategies opened');
            }}
          >
            Strategies✨
          </Tab>
          <Tab
            color={'text_secondary'}
            _selected={{ color: 'purple', fontWeight: 'bold' }}
            onClick={() => {
              mixpanel.track('All pools clicked');
            }}
          >
            Find yields
          </Tab>
        </TabList>
        <TabIndicator
          mt="-1.5px"
          height="3px"
          bg="purple"
          color="color1"
          borderRadius="1px"
        />
        <TabPanels>
          <TabPanel
            bg="color_3"
            float={'left'}
            width={'100%'}
            borderColor={'color_3'}
            borderRadius={'8px'}
            padding={'1rem 0'}
          >
            <Strategies />
          </TabPanel>
          <TabPanel
            bg="color_3"
            width={'100%'}
            float={'left'}
            borderColor={'color_3'}
            borderRadius={'8px'}
            padding={'1rem 0'}
          >
            <Pools />
          </TabPanel>
        </TabPanels>
      </Tabs>
      {/* <hr style={{width: '100%', borderColor: '#5f5f5f', float: 'left', margin: '20px 0'}}/> */}
      {/* <Center padding="10px 0" width={'100%'} float={'left'}>
        <Link href={CONSTANTS.COMMUNITY_TG} isExternal>
          <ChakraImage
            src={tg.src}
            width={{ base: '10', md: '20' }}
            margin="0 auto"
          />
        </Link>
      </Center>
      <Center width={'100%'} float="left">
        <Box
          width="300px"
          maxWidth={'100%'}
          marginTop={'20px'}
          borderTop={'1px solid var(--chakra-colors-highlight)'}
          textAlign={'center'}
          textColor={'purple'}
          padding="10px 0"
          fontSize={'13px'}
        >
          Made with ❤️ on Starknet
        </Box>
      </Center> */}
    </Container>
  );
}
