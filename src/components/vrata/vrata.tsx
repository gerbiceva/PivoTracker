import { Alert, Box, Button, Center, Stack } from '@mantine/core';
import { IconBluetooth, IconDoor, IconLink } from '@tabler/icons-react';
import { DOOR_SERVICE_UUID, HOLD_CHARACTERISTIC_UUID } from './getVrataDevice';
import { useWebBluetooth } from './useGetBluetooth';

export const Vrata = () => {
  const { isConnecting, sendUnlockCommand } = useWebBluetooth(
    DOOR_SERVICE_UUID,
    HOLD_CHARACTERISTIC_UUID,
  );

  // const isOnline = useDevicePolling();
  // const devicesApiAvailable = navigator.bluetooth?.getDevices != undefined;

  if (!navigator.bluetooth)
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
              Chrome če si na Androidu ali PC-ju in če si na iOS-u si zloudaj{' '}
              <a href="https://apps.apple.com/us/app/bluefy-web-ble-browser/id1492822055">
                Bluefy
              </a>
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

  return (
    <Center mih="80vh">
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
    </Center>
  );
};
