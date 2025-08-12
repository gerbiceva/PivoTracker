import { Avatar, Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { dayType } from './WashingTimetable';
import {
  FormatLocalDateCustom,
  ReadTimeFromUTCString,
} from '../../../../utils/timeUtils';
import { useGetAuthUser } from '../../../../utils/UseGetAuthUser';

export interface ReservationItemProps {
  reservation: dayType;
}

export const ReservationItemInfo = ({ reservation }: ReservationItemProps) => {
  const [opened, { open, close }] = useDisclosure(false);
  const { data } = useGetAuthUser();
  return (
    <>
      <Modal opened={opened} onClose={close} size="xl" centered>
        <Stack>
          <TextInput
            readOnly
            value={reservation.user_email}
            description="email"
            variant="filled"
          />
          <TextInput
            readOnly
            value={reservation.user_id}
            description="id"
            variant="filled"
          />
          <Group mt="xl" w="100%" justify="end">
            {data && data.id == reservation.user_id && (
              <Button size="sm" variant="light" color="red">
                Izbriši rezervacijo
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>
      <Button
        fullWidth
        color={reservation.machine_id == 1 ? 'indigo' : 'orange'}
        variant="light"
        size="md"
        onClick={open}
        leftSection={
          <Avatar size="sm">
            {reservation.user_email[0].toLocaleUpperCase()}
          </Avatar>
        }
      >
        {`${FormatLocalDateCustom(
          ReadTimeFromUTCString(reservation.slot_start_utc!),
          'HH:mm',
        )} - ${FormatLocalDateCustom(
          ReadTimeFromUTCString(reservation.slot_end_utc!),
          'HH:mm',
        )}`}
      </Button>
    </>
  );
};
