import { Alert, Box, Button, Center, Stack, Loader, Text } from '@mantine/core';
import { IconBluetooth, IconLink } from '@tabler/icons-react';
import { useWebBluetooth } from './useGetBluetooth';

const DOOR_SERVICE_UUID = 'a8cbc536-8c2b-4ddc-a3ad-9c1880f27f07';
const HOLD_CHARACTERISTIC_UUID = '00e158bf-f0b6-45c5-a401-0200966c4fec';

export const Vrata = () => {
  const {
    isAvailable,
    isConnecting,
    isSupported,
    hasPairedBefore,
    isSearching,
    connectToDevice,
    sendUnlockCommand,
  } = useWebBluetooth(DOOR_SERVICE_UUID, HOLD_CHARACTERISTIC_UUID);

  // Show loading state when searching for previously paired device
  if (isSearching) {
    return (
      <Center mih="80vh">
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text size="lg" fw={500}>
            Iskanje naprave...
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Približajte se vratom, da jih omogočite.
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Center mih="80vh">
      {/* bluetooth sploh ni podprt */}
      {!isSupported && (
        <Alert
          variant="outline"
          title="Brskalnik ni podprt"
          color="red"
          icon={<IconBluetooth></IconBluetooth>}
        >
          <Stack gap="xs">
            <span>
              Brskalnik ni podprt. Podporo za web bluetooth lahko najdete tukaj.
            </span>
            <span>
              Zloodaš Chrome če si na Androidu in če si na iOS-u si si sam
              kriv...
            </span>
            <Box ml="auto">
              <Button
                color="red"
                variant="light"
                component="a"
                target="_blank"
                href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API#browser_compatibility"
                rightSection={<IconLink />}
              >
                Podprte naprave
              </Button>
            </Box>
          </Stack>
        </Alert>
      )}

      {/* bluetooth ni podprt */}
      {isSupported && !isAvailable && (
        <Alert
          variant="outline"
          title="Bluetooth izklopljen"
          icon={<IconBluetooth></IconBluetooth>}
        >
          <Stack gap="xs">
            <span>
              Za odpiranje vrat vklopite bluetooth in pridite blizu vrat.
            </span>
          </Stack>
        </Alert>
      )}

      {isSupported && isAvailable && (
        <>
          {hasPairedBefore ? (
            // Returning user - show the main button
            <Button
              size="xl"
              variant="gradient"
              loading={isConnecting}
              onClick={() => {
                sendUnlockCommand();
              }}
            >
              Open sesamy
            </Button>
          ) : (
            // First-time user - show pairing instructions
            <Stack align="center" gap="md">
              <Text size="lg" fw={500}>
                Pariranje z napravo
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Kliknite gumb spodaj in poiščite napravo "Vrata" za pariranje.
              </Text>
              <Button
                size="xl"
                variant="gradient"
                loading={isConnecting}
                onClick={() => {
                  connectToDevice();
                }}
              >
                Poišči in poveži z "Vrata"
              </Button>
            </Stack>
          )}
        </>
      )}
    </Center>
  );
};
