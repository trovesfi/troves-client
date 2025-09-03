import React from 'react';
import {
  Box,
  Flex,
  Text,
  Link,
  IconButton,
  useDisclosure,
  Container,
  Grid,
} from '@chakra-ui/react';
import TgIcon from '@/assets/tg.svg';
import XIxon from '@/assets/x.svg';
import FullLogoIcon from '@public/fulllogo.svg';
import CONSTANTS from '@/constants';

const footerLinks = [
  {
    heading: 'Developers',
    links: [
      {
        label: 'Open-source',
        href: 'https://app.onlydust.com/p/strkfarm',
        isExternal: true,
      },
      { label: 'Audit', href: 'https://www.troves.fi/audit' },
      {
        label: 'Github',
        href: 'https://github.com/trovesfi',
        isExternal: true,
      },
    ],
  },
  {
    heading: 'General',
    links: [
      { label: 'Defi Spring', href: 'https://defispring.starknet.io/' },
      {
        label: 'Branding kit',
        href: 'https://drive.google.com/drive/folders/1-D6uizWgdH2XwbP0f3Fc22wQgxhr_RUY?usp=sharing',
      },
      { label: 'Status page', href: 'https://status.troves.fi/' },
    ],
  },
  {
    heading: 'Community',
    links: [
      { label: 'Telegram', href: 'https://troves.fi/tg', isExternal: true },
      {
        label: 'Twitter',
        href: 'https://twitter.com/trovesfi',
        isExternal: true,
      },
    ],
  },
];

const socialLinks = [
  // {
  //   icon: discord.src,
  //   label: 'Discord',
  //   href: 'https://discord.gg/',
  //   gradient: 'mycard_light',
  // },
  {
    icon: <TgIcon alt="Telegram" />,
    label: 'Telegram',
    href: CONSTANTS.COMMUNITY_TG,
    gradient: 'mycard_light',
  },
  {
    icon: <XIxon alt="Twitter" />,
    label: 'Twitter',
    href: 'https://troves.fi/twitter',
    gradient: 'mycard_light',
  },
];

const Footer: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Container width={'100%'} bg="mycard_dark" marginTop="100px">
      <Box
        width={'100%'}
        maxWidth="1152px"
        margin={'0px auto'}
        padding={{ base: '40px 10px 10px' }}
      >
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          gap="10px"
          paddingBottom="40px"
        >
          <Flex
            direction="column"
            align={{ base: 'center', md: 'flex-start' }}
            minW="220px"
          >
            <FullLogoIcon width={100} alt="logo" />
          </Flex>

          <Grid
            gridTemplateColumns={{
              base: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            }}
            justifyContent={{ base: 'center', md: 'flex-end' }}
            justifyItems={{ base: 'center', md: 'start' }}
            textAlign={{ base: 'center', md: 'left' }}
            gap={{ base: '16px', md: '32px' }}
          >
            {footerLinks.map((col) => (
              <Box key={col.heading} minW="120px">
                <Text fontWeight="bold" mb={3} color="white" fontSize={'14px'}>
                  {col.heading}
                </Text>
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    isExternal={link.isExternal}
                    color="text_subtle"
                    display="block"
                    marginBottom="10px"
                    fontSize={'13px'}
                    _hover={{ textDecoration: 'underline' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Box>
            ))}
          </Grid>
        </Flex>
      </Box>

      <Box borderTopWidth="1px" borderTopColor="white" opacity={0.2}></Box>

      <Box
        width={'100%'}
        maxWidth="1152px"
        margin={'0px auto'}
        // padding={{ base: ' 10px 10px' }}
      >
        <Flex
          paddingTop="24px"
          paddingBottom="24px"
          align="center"
          justify="space-between"
          direction={{ base: 'column', md: 'row' }}
          gap="4px"
        >
          <Text fontSize="sm" color="text_subtle">
            © 2024 Troves. All right reserved.
          </Text>
          <Flex align="center" gap={6}>
            <Text
              as="a"
              color="text_subtle"
              fontSize="sm"
              _hover={{ color: 'text_subtle', textDecoration: 'underline' }}
              mr={2}
              href="https://assets.troves.fi/tnc_v2.pdf"
              target="_blank"
            >
              Terms and Conditions
            </Text>
            <Flex gap={2}>
              {socialLinks.map((s) => (
                <IconButton
                  as="a"
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  icon={s.icon}
                  target="_blank"
                  rel="noopener noreferrer"
                  borderRadius="full"
                  bg="black"
                  _hover={{ filter: 'brightness(1.2)' }}
                />
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </Container>
  );
};

export default Footer;
