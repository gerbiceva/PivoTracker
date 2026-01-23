import { useEffect, useState } from 'react';
import { getVrataDevice } from './getVrataDevice';

export const useDevicePolling = () => {
  const [isDeviceInRange, setIsDeviceInRange] = useState<boolean>(false);

  if (!navigator.bluetooth || !navigator.bluetooth.getDevices) {
    return false;
  }

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    if (!navigator.bluetooth || !navigator.bluetooth.getDevices) {
      return;
    }

    const pollDeviceStatus = async () => {
      try {
        const device = await getVrataDevice();

        if (device) {
          // Check if device is currently connected or can be connected
          if (device.gatt && device.gatt.connected) {
            setIsDeviceInRange(true);
          } else {
            // Try to connect briefly to test range
            try {
              await device.gatt?.connect();
              setIsDeviceInRange(true);
              // Disconnect after testing if we don't need to stay connected
              // if (device.gatt?.connected) {
              //   device.gatt.disconnect();
              // }
            } catch {
              setIsDeviceInRange(false);
            }
          }
        } else {
          setIsDeviceInRange(false);
        }
      } catch (error) {
        setIsDeviceInRange(false);
      }
    };

    // Poll every 5 seconds when device has been paired before
    pollingInterval = setInterval(pollDeviceStatus, 1000);

    // Initial poll
    pollDeviceStatus();

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  return isDeviceInRange;
};
