'use client';

import { LATEST_TNC_DOC_VERSION, SIGNING_DATA, TnC_DOC_URL } from '@/constants';
import { addressAtom } from '@/store/claims.atoms';
import {
  Button,
  Center,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Spinner,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import {
  useAccount,
  useDisconnect,
  useSignTypedData,
} from '@starknet-react/core';
import axios from 'axios';
import { atomWithQuery } from 'jotai-tanstack-query';
import React, { useEffect, useMemo, useState } from 'react';
import { UserTncInfo } from '@/app/api/interfaces';
import { useAtom, useAtomValue } from 'jotai';
import { referralCodeAtom } from '@/store/referral.store';
import { useSearchParams } from 'next/navigation';
import { generateReferralCode } from '@/utils';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import mixpanel from 'mixpanel-browser';
import toast from 'react-hot-toast';

interface TncModalProps {}

export const UserTnCAtom = atomWithQuery((get) => {
  return {
    // we use referral code atom as key to ensure user exisits in db by then
    queryKey: ['tnc', get(addressAtom), get(referralCodeAtom)],
    queryFn: async (): Promise<null | UserTncInfo> => {
      const address: string | undefined = get(addressAtom);
      console.log(`address tnc`, address);
      if (!address) return null;
      const res = await axios.get(`/api/tnc/getUser/${address}`);
      return res.data;
    },
  };
});

const TncModal: React.FC<TncModalProps> = (props) => {
  const { address, account } = useAccount();
  const [refCode, setReferralCode] = useAtom(referralCodeAtom);
  const searchParams = useSearchParams();
  const userTncInfoRes = useAtomValue(UserTnCAtom);
  const userTncInfo = useMemo(
    () => userTncInfoRes.data,
    [userTncInfoRes, refCode],
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSigningPending, setIsSigningPending] = useState(false);
  const { disconnectAsync } = useDisconnect();

  const {
    signTypedData,
    error: signingError,
    data: sigData,
  } = useSignTypedData({
    params: SIGNING_DATA,
  });

  // set ref code of the user if it exists
  useEffect(() => {
    if (!userTncInfo) return;
    (async () => {
      if (userTncInfo.success && userTncInfo.user) {
        setReferralCode(userTncInfo.user.referralCode);
        console.log(`tncinfo`, userTncInfo.user);
        if (
          (userTncInfo.user.isTncSigned &&
            userTncInfo.user.tncDocVersion !== LATEST_TNC_DOC_VERSION) ||
          !userTncInfo.user.isTncSigned
        ) {
          onOpen();
        } else {
          onClose();
        }
        return;
      }

      if (!userTncInfo.success) {
        try {
          let referrer = searchParams.get('referrer');

          if (address && referrer && address === referrer) {
            referrer = null;
          }

          const res = await axios.post('/api/referral/createUser', {
            address,
            myReferralCode: generateReferralCode(),
            referrerAddress: referrer,
          });
          if (res.data.success && res.data.user) {
            setReferralCode(res.data.user.referralCode);
          }
        } catch (error) {
          console.error('Error while creating user', error);
        }
      }
    })();
  }, [userTncInfo]);

  useEffect(() => {
    console.log('signature', sigData);
    if (signingError) {
      toast.error(signingError.message, {
        position: 'bottom-right',
      });
      setIsSigningPending(false);
    }
    if (!address || !account || !sigData) {
      return;
    }

    async function processSign() {
      try {
        if (!sigData) {
          return;
        }

        const signature = sigData;
        if (signature && signature.length > 0) {
          const res2 = await axios.post('/api/tnc/signUser', {
            address,
            signature: JSON.stringify(signature),
          });

          if (res2.data?.success) {
            onClose();
          } else {
            toast.error(res2.data?.message || 'Error verifying T&C');
          }
        }
      } catch (error) {
        console.error('signature', error);
        mixpanel.track('TnC signing failed', { address });
      }
      setIsSigningPending(false);
    }
    processSign();
  }, [sigData, signingError]);

  const handleSign = async () => {
    if (!address || !account) {
      return;
    }
    mixpanel.track('TnC agreed', { address });

    setIsSigningPending(true);
    signTypedData();
  };

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      isCentered
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent borderRadius=".5rem" maxW="32rem">
        {/* <ModalCloseButton color="#7F49E5"/> */}
        <ModalBody
          backgroundColor="#1A1C26"
          padding="3rem"
          border="1px solid #7F49E5"
          borderRadius=".5rem"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          gap="1rem"
        >
          <Text textAlign="center" fontSize="1.5rem" fontWeight="bold">
            Terms and Conditions
          </Text>

          <Text textAlign="justify" color="white" width={'100%'}>
            Please read the following terms and conditions carefully before
            signing. You are required to sign this to continue using the App.
          </Text>

          <Text
            textAlign="left"
            as={'a'}
            width={'100%'}
            fontWeight={'bold'}
            href={TnC_DOC_URL}
            color="white"
            target="_blank"
            _hover={{ textDecor: 'underline' }}
            autoFocus={false}
            _focus={{
              boxShadow: 'none',
              outline: 'none',
            }}
            _focusVisible={{
              boxShadow: 'none',
              outline: 'none',
            }}
          >
            T&C Document link <ExternalLinkIcon />
          </Text>

          <Text textAlign="left" width={'100%'}>
            By clicking agree, you agree to STRKFarm terms and conditions as
            stated in above document.
          </Text>

          <Center>
            <Button
              bg="purple"
              borderRadius=".5rem"
              px="1rem"
              py=".5rem"
              color="white"
              cursor="pointer"
              _hover={{
                opacity: 0.9,
                backgroundColor: '#7F49E5',
              }}
              onClick={handleSign}
            >
              Agree{' '}
              {isSigningPending && (
                <Spinner size={'xs'} color="white" ml={'5px'} />
              )}
            </Button>
            <Button
              bg="bg"
              borderRadius=".5rem"
              px="1rem"
              py=".5rem"
              color="color2"
              cursor="pointer"
              onClick={() => {
                mixpanel.track('TnC declined', { address });
                disconnectAsync();
                onClose();
              }}
              ml={'10px'}
            >
              Disconnect
            </Button>
          </Center>
          <Text textAlign={'center'} color={'light_grey'} fontSize={'12px'}>
            Note: Only deployed accounts can sign
          </Text>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TncModal;
