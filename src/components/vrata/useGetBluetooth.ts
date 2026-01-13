import { useState, useEffect, useCallback, useRef } from 'react';

// Define types for Bluetooth API objects
interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  connected: boolean;
  getPrimaryService(
    service: BluetoothServiceUUID,
  ): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(
    characteristic: BluetoothCharacteristicUUID,
  ): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
  properties: {
    write: boolean;
    writeWithoutResponse: boolean;
  };
  writeValueWithResponse(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
}

type BluetoothServiceUUID = string | number;
type BluetoothCharacteristicUUID = string | number;

export interface UseWebBluetoothResult {
  isSupported: boolean;
  isAvailable: boolean | undefined;
  error: Error | string | null;
  isConnecting: boolean;
  hasPairedBefore: boolean;
  isSearching: boolean;
  isDeviceInRange: boolean;
  connectToDevice: () => Promise<boolean>;
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
  const [hasPairedBefore, setHasPairedBefore] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDeviceInRange, setIsDeviceInRange] = useState<boolean>(false);
  const deviceRef = useRef<BluetoothDevice>(undefined);

  const getBtDevice = async () => {
    const deviceRequestOptions: RequestDeviceOptions = {
      filters: [
        {
          name: 'Vrata',
          services: [serviceUUID.toString()],
        },
      ],
      optionalServices: [serviceUUID.toString()],
    };

    try {
      // Check if user has paired with the device before
      const savedDevices = await navigator.bluetooth.getDevices();
      const savedDevice = savedDevices.find(
        (device) => device.name === 'Vrata',
      );

      if (savedDevice) {
        setHasPairedBefore(true);
        setIsSearching(true);

        // Try to reconnect to the saved device
        try {
          deviceRef.current = savedDevice;

          // Set up a flag to prevent multiple cleanup calls
          let isSearchCompleted = false;

          const onAdvertisementReceived = () => {
            if (!isSearchCompleted) {
              isSearchCompleted = true;
              setIsSearching(false);
              console.log('Device found nearby!');
            }
          };

          savedDevice.addEventListener(
            'advertisementreceived',
            onAdvertisementReceived,
          );

          // Start watching for advertisements - this promise resolves when an advertisement is received
          const watchPromise = savedDevice.watchAdvertisements();
          console.log('Watching for device advertisements...');

          // Set a timeout to stop searching if device doesn't appear
          const searchTimeout = setTimeout(() => {
            if (!isSearchCompleted) {
              isSearchCompleted = true;
              console.log('Search timeout, stopping advertisement watching...');
              savedDevice.removeEventListener(
                'advertisementreceived',
                onAdvertisementReceived,
              );

              // Fallback: try direct connection if available
              if (savedDevice.gatt && !savedDevice.gatt.connected) {
                savedDevice.gatt
                  .connect()
                  .then(() => {
                    setIsSearching(false);
                  })
                  .catch(() => {
                    setIsSearching(false);
                  });
              } else {
                setIsSearching(false);
              }
            }
          }, 10000); // 10 second timeout

          // Wait for the watch promise to resolve (when advertisement is received)
          watchPromise
            .then(() => {
              if (!isSearchCompleted) {
                isSearchCompleted = true;
                setIsSearching(false);
                clearTimeout(searchTimeout);
                savedDevice.removeEventListener(
                  'advertisementreceived',
                  onAdvertisementReceived,
                );
                console.log('Advertisement received, device is nearby!');
              }
            })
            .catch((watchError) => {
              console.log('Watch advertisements failed:', watchError);
              if (!isSearchCompleted) {
                isSearchCompleted = true;
                setIsSearching(false);
                clearTimeout(searchTimeout);
                savedDevice.removeEventListener(
                  'advertisementreceived',
                  onAdvertisementReceived,
                );
              }
            });

          // Note: BluetoothRemoteGATTServer doesn't have addEventListener for disconnection
          // The disconnection handling would need to be done elsewhere when actually connecting
        } catch (watchError) {
          console.log(
            'Could not watch advertisements, attempting connection...',
          );
          // If watching fails, try direct connection
          if (savedDevice.gatt && !savedDevice.gatt.connected) {
            try {
              await savedDevice.gatt.connect();
            } catch (connectError) {
              console.log('Connection attempt failed:', connectError);
            }
          }
          setIsSearching(false);
        }
      } else {
        setHasPairedBefore(false);
        // Request the device for first-time users
        deviceRef.current = await navigator.bluetooth.requestDevice(
          deviceRequestOptions,
        );
        // After successful pairing, set hasPairedBefore to true so the UI switches to door opener mode
        setHasPairedBefore(true);
        setIsSearching(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      setIsSearching(false);
    }
  };

  useEffect(() => {
    getBtDevice();
  });

  // Function to check initial availability and add listener
  useEffect(() => {
    let isMounted = true;

    const updateAvailability = async () => {
      try {
        if (!('bluetooth' in navigator)) {
          throw new Error('Bluetooth API not supported by this browser.');
        }

        const bluetooth = navigator.bluetooth;
        if (!bluetooth) {
          throw new Error('Bluetooth API is not available.');
        }

        const available = await bluetooth.getAvailability();
        if (isMounted) {
          setBluetoothAvailability(available);
        }
      } catch (err) {
        console.error('Error checking initial Bluetooth availability:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setBluetoothAvailability(false);
        }
      }
    };

    updateAvailability();

    // Add event listener for changes in availability
    const handleAvailabilityChange = (event: Event & { value?: boolean }) => {
      if (isMounted && event.value !== undefined) {
        setBluetoothAvailability(event.value);
      }
    };

    if ('bluetooth' in navigator && navigator.bluetooth) {
      navigator.bluetooth.addEventListener(
        'availabilitychanged',
        handleAvailabilityChange as EventListener,
      );
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if ('bluetooth' in navigator && navigator.bluetooth) {
        navigator.bluetooth.removeEventListener(
          'availabilitychanged',
          handleAvailabilityChange as EventListener,
        );
      }
    };
  }, []);

  // Function to establish connection to the device
  const connectToDevice = useCallback(async (): Promise<boolean> => {
    if (!('bluetooth' in navigator)) {
      const errorMsg = 'Bluetooth API not supported by this browser.';
      setError(errorMsg);
      return false;
    }

    if (bluetoothAvailability === false) {
      const errorMsg = 'Bluetooth is not available or enabled on this device.';
      setError(errorMsg);
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      if (!deviceRef.current) {
        return false;
      }

      // Connect to GATT Server
      if (!deviceRef.current?.gatt) {
        throw new Error('Device does not have GATT server');
      }

      const server = await deviceRef.current.gatt.connect();
      console.log('> Connected to GATT server');
      setIsConnecting(false);
      return true;
    } catch (err) {
      console.error('Error connecting to device:', err);
      setError(err instanceof Error ? err.message : String(err));
      setIsConnecting(false);
      return false;
    }
  }, [bluetoothAvailability]);

  // Function to send unlock command to the device
  const sendUnlockCommand = useCallback(async (): Promise<boolean> => {
    if (!('bluetooth' in navigator)) {
      const errorMsg = 'Bluetooth API not supported by this browser.';
      setError(errorMsg);
      return false;
    }

    if (bluetoothAvailability === false) {
      const errorMsg = 'Bluetooth is not available or enabled on this device.';
      setError(errorMsg);
      return false;
    }

    setIsConnecting(true);
    setError(null);

    let server: BluetoothRemoteGATTServer | null = null;

    try {
      if (!deviceRef.current) {
        return false;
      }

      // Connect to GATT Server if not already connected
      if (!deviceRef.current?.gatt) {
        throw new Error('Device does not have GATT server');
      }

      server = await deviceRef.current.gatt.connect();
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
        throw new Error(
          `Characteristic ${characteristicUUID} does not support writing.`,
        );
      }

      // Send the unlock command (2)
      const unlockCommand = new Uint8Array([2]).buffer;

      await characteristic.writeValueWithResponse(unlockCommand);
      console.log('> Unlock command sent successfully');

      setIsConnecting(false);
      return true;
    } catch (err) {
      console.error('Error sending unlock command via Bluetooth:', err);
      setError(err instanceof Error ? err.message : String(err));
      setIsConnecting(false);

      // Attempt cleanup on failure
      if (server && server.connected) {
        try {
          server.disconnect();
          console.log('> Disconnected from GATT server due to error.');
        } catch (disconnectErr) {
          console.error(
            'Error disconnecting server on failure:',
            disconnectErr,
          );
        }
      }
      return false;
    }
  }, [bluetoothAvailability]);

  // Background polling to check if device is in range
  useEffect(() => {
    if (!hasPairedBefore || !deviceRef.current) {
      return;
    }

    let pollingInterval: NodeJS.Timeout;

    const pollDeviceStatus = async () => {
      try {
        const savedDevices = await navigator.bluetooth.getDevices();
        const device = savedDevices.find((d) => d.name === 'Vrata');

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
              if (device.gatt?.connected && !isConnecting) {
                device.gatt.disconnect();
              }
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
    pollingInterval = setInterval(pollDeviceStatus, 5000);

    // Initial poll
    pollDeviceStatus();

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [hasPairedBefore, isConnecting]);

  return {
    isSupported: 'bluetooth' in navigator,
    isAvailable: bluetoothAvailability,
    error,
    isConnecting,
    hasPairedBefore,
    isSearching,
    isDeviceInRange,
    connectToDevice,
    sendUnlockCommand,
  };
};

// Remove custom interface and let the browser API handle the types
