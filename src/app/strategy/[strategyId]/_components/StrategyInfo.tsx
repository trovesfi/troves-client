import {
  Avatar,
  AvatarGroup,
  Box,
  Flex,
  Link,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import ShieldIcon from '@/assets/shield.svg';
import { StrategyInfo } from '@/store/strategies.atoms';

export function StrategyInfoComponent(props: { strategy: StrategyInfo<any> }) {
  const { strategy } = props;
  return (
    <Flex gap={'16px'} alignItems={'center'}>
      <AvatarGroup size={{ base: 'sm', md: 'md' }} mr={'5px'}>
        {strategy &&
          strategy.metadata.depositTokens.length > 0 &&
          strategy.metadata.depositTokens.map((token: any) => {
            return (
              <Avatar
                key={token.address}
                marginRight={'5px'}
                src={token.logo}
              />
            );
          })}
        {strategy && strategy.metadata.depositTokens.length == 0 && (
          <Avatar
            marginRight={'5px'}
            src={strategy?.holdingTokens[0].logo}
            width={'64px'}
            height={'64px'}
          />
        )}
      </AvatarGroup>
      <Flex alignItems="center" gap="4px">
        <Text
          fontSize={{ base: '20px', md: '32px' }}
          fontWeight={'600'}
          color="white"
        >
          {strategy ? strategy.name : 'Strategy Not found'}
        </Text>
        {strategy.metadata.auditUrl && (
          <Tooltip label={<Box>Audited. Click to view report.</Box>}>
            <Box
              display={'flex'}
              alignItems={'center'}
              justifyContent={'center'}
              bg={'badge_green'}
              width={'27px'}
              height={'27px'}
              padding={'3px 5px'}
              borderRadius={'20px'}
            >
              <Link href={strategy.metadata.auditUrl} target="_blank">
                <ShieldIcon />
              </Link>
            </Box>
          </Tooltip>
        )}
      </Flex>
    </Flex>
  );
}
