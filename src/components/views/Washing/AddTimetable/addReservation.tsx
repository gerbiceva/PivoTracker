import { Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Dayjs } from 'dayjs';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { refetchTables } from '../../../../supabase/supa-utils/supaSWRCache';
import { WriteTimeToUTCString } from '../../../../utils/timeUtils';
import { invalidateDailyWashing } from './GetSlotsByDay';
import { invalidateWeeklyWashing } from './GetWashingByWeek';

// Reserves a slot for the current user. Resolves to true on success.
export const addReservation = async (
  dateTimeStart: Dayjs,
  dateTimeEnd: Dayjs,
  machine: number,
) => {
  const { error } = await supabaseClient
    .rpc('add_reservation_with_range', {
      p_slot_start: WriteTimeToUTCString(dateTimeStart),
      p_slot_end: WriteTimeToUTCString(dateTimeEnd),
      p_machine_id: machine,
    })
    .select();

  if (error) {
    notifications.show({
      title: 'Napaka',
      color: 'red',
      autoClose: 1500,
      message: <Text>{error.message}</Text>,
    });
    return false;
  }

  notifications.show({
    title: 'Dodano',
    color: 'green',
    autoClose: 1500,
    message: <Text>Dodano.</Text>,
  });
  invalidateWeeklyWashing();
  invalidateDailyWashing();
  refetchTables('reservations');
  return true;
};
