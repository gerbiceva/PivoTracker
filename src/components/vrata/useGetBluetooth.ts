import { useState, useEffect, useCallback } from 'react';
import { useDevicePolling } from './useDevicePolling';
import { getVrataDevice } from './getVrataDevice';

type BluetoothServiceUUID = string | number;
type BluetoothCharacteristicUUID = string | number;

export interface UseWebBluetoothResult {
  isSupported: boolean;
  isAvailable: boolean | undefined;
  error: Error | string | null;
  isConnecting: boolean;
  // isDeviceInRange: boolean;
  // connectToDevice: () => Promise<boolean>;
  sendUnlockCommand: () => Promise<boolean>;
}
export const useWebBluetooth = (
  serviceUUID: BluetoothServiceUUID,
  characteristicUUID: BluetoothCharacteristicUUID,
): UseWebBluetoothResult => {
  const [bluetoothAvailability, setBluetoothAvailability] = useState<
    boolean | undefined
  >(undefined);
  const [error, setError] = useState<Error | string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const getVrata = useCallback(getVrataDevice, []);

  // // Function to check initial availability and add listener
  // useEffect(() => {
  //   let isMounted = true;

  //   const updateAvailability = async () => {
  //     try {
  //       if (!('bluetooth' in navigator)) {
  //         throw new Error('Bluetooth API not supported by this browser.');
  //       }

  //       const bluetooth = navigator.bluetooth;
  //       if (!bluetooth) {
  //         throw new Error('Bluetooth API is not available.');
  //       }

  //       const available = await bluetooth.getAvailability();
  //       if (isMounted) {
  //         setBluetoothAvailability(available);
  //       }
  //     } catch (err) {
  //       console.error('Error checking initial Bluetooth availability:', err);
  //       if (isMounted) {
  //         setError(err instanceof Error ? err : new Error(String(err)));
  //         setBluetoothAvailability(false);
  //       }
  //     }
  //   };

  //   updateAvailability();

  //   // Add event listener for changes in availability
  //   const handleAvailabilityChange = (event: Event & { value?: boolean; }) => {
  //     if (isMounted && event.value !== undefined) {
  //       setBluetoothAvailability(event.value);
  //     }
  //   };

  //   if ('bluetooth' in navigator && navigator.bluetooth) {
  //     navigator.bluetooth.addEventListener(
  //       'availabilitychanged',
  //       handleAvailabilityChange as EventListener,
  //     );
  //   }

  //   // Cleanup function
  //   return () => {
  //     isMounted = false;
  //     if ('bluetooth' in navigator && navigator.bluetooth) {
  //       navigator.bluetooth.removeEventListener(
  //         'availabilitychanged',
  //         handleAvailabilityChange as EventListener,
  //       );
  //     }
  //   };
  // }, []);

  // // Function to establish connection to the device
  // const connectToDevice = useCallback(async (): Promise<boolean> => {
  //   if (!('bluetooth' in navigator)) {
  //     const errorMsg = 'Bluetooth API not supported by this browser.';
  //     setError(errorMsg);
  //     return false;
  //   }
  //   setError(null);

  //   try {
  //     const device = await getVrataDevice();
  //     // Connect to GATT Server
  //     if (!device?.gatt) {
  //       throw new Error('Device does not have GATT server');
  //     }
  //     const server = await device.gatt.connect();
  //     console.log('> Connected to GATT server');
  //     setIsConnecting(false);
  //     return true;
  //   } catch (err) {
  //     console.error('Error connecting to device:', err);
  //     setError(err instanceof Error ? err.message : String(err));
  //     setIsConnecting(false);
  //     return false;
  //   }
  // }, [bluetoothAvailability]);

  // Function to send unlock command to the device
  const sendUnlockCommand = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);

    if (!('bluetooth' in navigator)) {
      const errorMsg = 'Bluetooth API not supported by this browser.';
      setError(errorMsg);
      setIsConnecting(false);
      return false;
    }

    if (bluetoothAvailability === false) {
      const errorMsg = 'Bluetooth is not available or enabled on this device.';
      setError(errorMsg);
      setIsConnecting(false);
      return false;
    }


    let server: BluetoothRemoteGATTServer | null = null;
    let device: BluetoothDevice | undefined = undefined;

    try {
      const temp_dev = await getVrata();
      if (!temp_dev) {
        return false;
      }
      device = temp_dev;
    } catch (e) {
      setError(e as Error);
      return false;
    }
    finally {
      setIsConnecting(false);
    }

    // try {
    if (!device) {
      setIsConnecting(false);
      return false;
    }

    // Connect to GATT Server if not already connected
    if (!device?.gatt) {
      setIsConnecting(false);
      throw new Error('Device does not have GATT server');
    }

    server = await device.gatt.connect();
    console.log('> Connected to GATT server');

    // Get the specified service
    const primaryService = await server.getPrimaryService(
      serviceUUID.toString(),
    );
    console.log('> Found primary service:', serviceUUID);

    // Get the specified characteristic
    const characteristic = await primaryService.getCharacteristic(
      characteristicUUID.toString(),
    );
    console.log('> Found characteristic:', characteristicUUID);

    // Check if the characteristic is writable
    if (
      !characteristic.properties.write &&
      !characteristic.properties.writeWithoutResponse
    ) {
      setIsConnecting(false);
      throw new Error(
        `Characteristic ${characteristicUUID} does not support writing.`,
      );
    }

    // Send the unlock command (2)
    const unlockCommand = new Uint8Array([1]).buffer;
    await characteristic.writeValueWithResponse(unlockCommand);
    console.log('> Unlock command sent successfully');

    setIsConnecting(false);
    return true;
    // } catch (err) {
    //   setIsConnecting(false);
    //   console.error('Error sending unlock command via Bluetooth:', err);
    //   setError(err instanceof Error ? err.message : String(err));
    //   setIsConnecting(false);

    //   // Attempt cleanup on failure
    //   if (server && server.connected) {
    //     try {
    //       server.disconnect();
    //       console.log('> Disconnected from GATT server due to error.');
    //     } catch (disconnectErr) {
    //       setIsConnecting(false);
    //       console.error(
    //         'Error disconnecting server on failure:',
    //         disconnectErr,
    //       );
    //     }
    //   }
    //   setIsConnecting(false);
    //   return false;
    // }
  }, []);

  // Use the device polling hook
  // const deviceIsInRange = useDevicePolling();

  return {
    isSupported: 'bluetooth' in navigator,
    isAvailable: bluetoothAvailability,
    error,
    isConnecting,
    // isDeviceInRange: deviceIsInRange,
    // connectToDevice,
    sendUnlockCommand,
  };
};
