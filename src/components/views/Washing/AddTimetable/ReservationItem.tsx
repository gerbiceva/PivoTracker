import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconClock, IconPhone, IconTrash } from '@tabler/icons-react';
import {
  FormatLocalDateCustom,
  ReadTimeFromUTCString,
} from '../../../../utils/timeUtils';
import { useGetAuthUser } from '../../../../utils/UseGetAuthUser';
import { getZodiacSign, zodiacToIcon } from '../../../../utils/zodiac';
import { dayType } from './AddWashingTimetable';
import { removeReservation } from '../RemoveReservation';
import { capitalizeName } from '../../UserManagement/UserEditing/useUserEditing';
import { SlotCard } from './SlotCard';
import { ReactNode } from 'react';

export interface ReservationItemProps {
  reservation: dayType;
}

const InfoRow = ({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) => (
  <Group gap="sm" wrap="nowrap">
    <ThemeIcon variant="light" color="gray" size="md" radius="md">
      {icon}
    </ThemeIcon>
    <Text size="sm">{children}</Text>
  </Group>
);

export const ReservationItemInfo = ({ reservation }: ReservationItemProps) => {
  const [opened, { open, close }] = useDisclosure(false);
  const { data } = useGetAuthUser();

  const zodiac = getZodiacSign(
    ReadTimeFromUTCString(reservation.date_of_birth),
  );
  const color = reservation.machine_id == 1 ? 'indigo' : 'orange';
  const name = capitalizeName(
    `${reservation.name ?? ''} ${reservation.surname ?? ''}`.trim(),
  );
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);
  const start = ReadTimeFromUTCString(reservation.slot_start_utc).local();
  const end = ReadTimeFromUTCString(reservation.slot_end_utc).local();
  const bookedAt = ReadTimeFromUTCString(reservation.created_at).local();
  const isMine = data && data.id == reservation.user_id;

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        centered
        title={
          <Group gap="md" wrap="nowrap">
            <Avatar color={color} radius="xl" size="lg">
              {initials}
            </Avatar>
            <Stack gap={4}>
              <Text fw={700} size="lg" lh={1.2}>
                {name}
              </Text>
              <Group gap={6}>
                {reservation.room != null && (
                  <Badge variant="light" color="gray">
                    Soba {reservation.room}
                  </Badge>
                )}
                {isMine && (
                  <Badge variant="light" color={color}>
                    Moj termin
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>
        }
      >
        <Stack gap="md">
          <SlotCard
            start={start}
            end={end}
            machineLabel={
              reservation.machine_name ?? `Stroj ${reservation.machine_id}`
            }
            color={color}
          />

          <Stack gap="xs">
            {reservation.phone_number && (
              <InfoRow icon={<IconPhone size={16} />}>
                <Anchor href={`tel:${reservation.phone_number}`} inherit>
                  {reservation.phone_number}
                </Anchor>
              </InfoRow>
            )}
            <InfoRow icon={<IconClock size={16} />}>
              Rezervirano {bookedAt.format('D. MMMM [ob] HH:mm')}
            </InfoRow>
          </Stack>

          <Group justify="space-between" align="center">
            {zodiac ? (
              <Tooltip color="pink" label={zodiac}>
                <Box opacity={0.25} lh={0}>
                  {zodiacToIcon(zodiac, '2rem')}
                </Box>
              </Tooltip>
            ) : (
              <span />
            )}
            {isMine && (
              <Button
                variant="light"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={() => {
                  removeReservation(reservation.reservation_id);
                }}
              >
                Izbriši rezervacijo
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>
      <Button
        fullWidth
        color={color}
        variant="light"
        size="md"
        onClick={open}
        leftSection={
          <Avatar size="sm" color="">
            {initials}
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
