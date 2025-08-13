import {
  Avatar,
  Box,
  Button,
  Center,
  Flex,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { dayType } from './WashingTimetable';
import {
  FormatLocalDateCustom,
  ReadTimeFromUTCString,
} from '../../../../utils/timeUtils';
import { useGetAuthUser } from '../../../../utils/UseGetAuthUser';
import { getZodiacSign, zodiacToIcon } from '../../../../utils/zodiac';

export interface ReservationItemProps {
  reservation: dayType;
}

export const ReservationItemInfo = ({ reservation }: ReservationItemProps) => {
  const [opened, { open, close }] = useDisclosure(false);
  const { data } = useGetAuthUser();
  return (
    <>
      <Modal opened={opened} onClose={close} size="xl" centered>
        <Flex justify="center" align="center" gap="xl" mb="md">
          <Tooltip
            color="pink"
            label={getZodiacSign(
              ReadTimeFromUTCString(reservation.date_of_birth),
            )}
          >
            <Box opacity={0.1}>
              {zodiacToIcon(
                getZodiacSign(ReadTimeFromUTCString(reservation.date_of_birth)),
                '7rem',
              )}
            </Box>
          </Tooltip>
          <Stack w="100%">
            <Group w="100%" justify="stretch" wrap="nowrap">
              <TextInput
                w="100%"
                readOnly
                value={reservation.name}
                description="ime"
                variant="filled"
              />
              <TextInput
                w="100%"
                readOnly
                value={reservation.surname}
                description="priimek"
                variant="filled"
              />
            </Group>
            <TextInput
              readOnly
              value={reservation.room}
              description="številka sobe"
              variant="filled"
            />
          </Stack>
        </Flex>

        {reservation.phone_number && (
          <TextInput
            readOnly
            value={reservation.phone_number}
            description="telefon"
            variant="filled"
          />
        )}
        <Group mt="xl" w="100%" justify="end">
          {data && data.id == reservation.user_id && (
            <Button size="sm" variant="light" color="red">
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
          <Avatar size="sm">
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
