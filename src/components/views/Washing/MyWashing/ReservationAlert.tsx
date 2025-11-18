import {
  Stack,
  Text,
  Group,
  ActionIcon,
  Alert,
  Badge,
  ThemeIcon,
} from '@mantine/core';
import {
  FormatLocalDateCustom,
  ReadTimeFromUTCString,
} from '../../../../utils/timeUtils';
import { IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Database } from '../../../../supabase/supabase';

export type ReservationType =
  Database['public']['Functions']['get_reservations_for_user']['Returns'][0];
interface ReservationAlertProps {
  reservation: ReservationType; // TODO: Define a proper type for reservation
  onRemove?: (id: number) => void;
}

export const ReservationAlert = ({
  reservation,
  onRemove,
}: ReservationAlertProps) => {
  return (
    <Alert
      p="md"
      variant={
        ReadTimeFromUTCString(reservation.slot_end_utc) < dayjs().utc()
          ? 'outline'
          : 'default'
      }
      color={reservation.machine_id == 1 ? 'indigo' : 'orange'}
    >
      <Stack justify="space-between" w="100%">
        <Group w="100%" justify="space-between">
          <Group gap="xs">
            <ThemeIcon variant="light" color="gray">
              {FormatLocalDateCustom(
                ReadTimeFromUTCString(reservation.slot_start_utc),
                'DD',
              )}
            </ThemeIcon>
            <Text fw="" c="gray">
              {FormatLocalDateCustom(
                ReadTimeFromUTCString(reservation.slot_start_utc),
                'ddd',
              )}
            </Text>
          </Group>

          {onRemove && (
            <ActionIcon
              size="sm"
              color="grayish"
              variant="light"
              onClick={() => {
                onRemove(reservation.reservation_id);
              }}
            >
              <IconTrash />
            </ActionIcon>
          )}
        </Group>

        <Group>
          <Text>
            {FormatLocalDateCustom(
              ReadTimeFromUTCString(reservation.slot_start_utc),
              'HH',
            ) +
              'h' +
              ' - ' +
              FormatLocalDateCustom(
                ReadTimeFromUTCString(reservation.slot_end_utc),
                'HH',
              ) +
              'h'}
          </Text>
          <Badge
            variant="light"
            color={reservation.machine_id == 1 ? 'indigo' : 'orange'}
          >
            {reservation.machine_name}
          </Badge>
        </Group>
      </Stack>
    </Alert>
  );
};
