export const DEVICE_NAME = 'Vrata';
export const DOOR_SERVICE_UUID = 'a8cbc536-8c2b-4ddc-a3ad-9c1880f27f07';
export const HOLD_CHARACTERISTIC_UUID = '00e158bf-f0b6-45c5-a401-0200966c4fec';

export const getVrataDevice = async () => {
  // if (navigator.bluetooth?.getDevices) {
  //   const device = (await navigator.bluetooth.getDevices()).find(
  //     (dev) => dev.name == DEVICE_NAME,
  //   );
  //   if (device) {
  //     return device;
  //   }
  // }

  const deviceRequestOptions: RequestDeviceOptions = {
    filters: [
      {
        name: 'Vrata',
        services: [DOOR_SERVICE_UUID.toString()],
      },
    ],
    optionalServices: [DOOR_SERVICE_UUID.toString()],
  };
  return await navigator.bluetooth.requestDevice(
    deviceRequestOptions,
  );
};
