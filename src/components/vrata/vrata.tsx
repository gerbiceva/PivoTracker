import { Alert, Box, Button, Center, Stack, Loader, Text } from '@mantine/core';
import { IconBluetooth, IconDoor, IconLink } from '@tabler/icons-react';
import { useWebBluetooth } from './useGetBluetooth';
import { useDevicePolling } from './useDevicePolling';
import { DOOR_SERVICE_UUID, HOLD_CHARACTERISTIC_UUID } from './getDevice';

export const Vrata = () => {
  const {
    isAvailable,
    isConnecting,
    isSupported,
    hasPairedBefore,
    sendUnlockCommand,
  } = useWebBluetooth(DOOR_SERVICE_UUID, HOLD_CHARACTERISTIC_UUID);

  const isOnline = useDevicePolling();

  if (!isSupported)
    return (
      <Center mih="80vh">
        {/* bluetooth sploh ni podprt */}
        <Alert
          variant="light"
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
            <Box ml="auto" mt="lg">
              <Button
                color="gray"
                variant="outline"
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
      </Center>
    );

  // Show loading state when searching for previously paired device
  if (!isOnline && hasPairedBefore) {
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
              radius="xs"
              size="xl"
              variant="gradient"
              loading={isConnecting}
              onClick={() => {
                sendUnlockCommand();
              }}
              leftSection={<IconDoor size={17}></IconDoor>}
            >
              Odpri vrata
            </Button>
          ) : (
            // First-time user - show pairing instructions
            <Stack align="center" gap="md">
              <Text size="lg" fw={500}>
                Povezovanje z napravo
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Počakajte da se brskalnik poveže z Vrati
              </Text>
            </Stack>
          )}
        </>
      )}
    </Center>
  );
};
