import {
  Avatar,
  Box,
  Button,
  Flex,
  Group,
  Modal,
  Stack,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  FormatLocalDateCustom,
  ReadTimeFromUTCString,
} from '../../../../utils/timeUtils';
import { useGetAuthUser } from '../../../../utils/UseGetAuthUser';
import { getZodiacSign, zodiacToIcon } from '../../../../utils/zodiac';
import { dayType } from './WashingTimetable';
import { removeReservation } from '../RemoveReservation';

export interface ReservationItemProps {
  reservation: dayType;
}

export const ReservationItemInfo = ({ reservation }: ReservationItemProps) => {
  const [opened, { open, close }] = useDisclosure(false);
  const { data } = useGetAuthUser();

  const zodiac = getZodiacSign(
    ReadTimeFromUTCString(reservation.date_of_birth),
  );
  return (
    <>
      <Modal opened={opened} onClose={close} size="xl" centered>
        <Flex justify="center" align="center" gap="xl" mb="md">
          <Tooltip color="pink" label={zodiac}>
            <Box opacity={0.1}>{zodiac && zodiacToIcon(zodiac, '7rem')}</Box>
          </Tooltip>
          <Stack w="100%">
            <Group w="100%" justify="stretch" wrap="nowrap">
              <TextInput
                w="100%"
                readOnly
                value={reservation.name}
                description="Ime"
                variant="filled"
              />
              <TextInput
                w="100%"
                readOnly
                value={reservation.surname}
                description="Priimek"
                variant="filled"
              />
            </Group>
            <TextInput
              readOnly
              value={reservation.room}
              description="Številka sobe"
              variant="filled"
            />
          </Stack>
        </Flex>
        <Stack>
          {reservation.phone_number && (
            <TextInput
              readOnly
              value={reservation.phone_number}
              description="Telefon"
              variant="filled"
            />
          )}
          <Group w="100%" justify="stretch" wrap="nowrap">
            <TextInput
              w="100%"
              readOnly
              value={FormatLocalDateCustom(
                ReadTimeFromUTCString(reservation.created_at),
                'MMMM DD. HH:mm',
              )}
              description="Čas rezervacije"
              variant="filled"
            />
            <TextInput
              w="100%"
              readOnly
              value={
                FormatLocalDateCustom(
                  ReadTimeFromUTCString(reservation.slot_start_utc),
                  'HH:mm',
                ) +
                ' - ' +
                FormatLocalDateCustom(
                  ReadTimeFromUTCString(reservation.slot_end_utc),
                  'HH:mm',
                )
              }
              description="Termin"
              variant="filled"
            />
          </Group>
        </Stack>

        <Group mt="xl" w="100%" justify="end">
          {data && data.id == reservation.user_id && (
            <Button
              size="sm"
              variant="light"
              color="red"
              onClick={() => {
                removeReservation(reservation.reservation_id);
              }}
            >
              Izbriši rezervacijo
            </Button>
          )}
        </Group>
      </Modal>
      <Button
        fullWidth
        color={reservation.machine_id == 1 ? 'indigo' : 'orange'}
        variant="light"
        size="md"
        onClick={open}
        leftSection={
          <Avatar size="sm" color="">
            {reservation.name[0] + reservation.surname[0].toLocaleUpperCase()}
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
