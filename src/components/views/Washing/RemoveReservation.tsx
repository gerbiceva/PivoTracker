import { Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Database } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { Unpacked } from '../../../utils/objectSplit';
import { invalidateUserReservations } from './MyWashing/UserReservations';
import { invalidateDailyWashing } from './Timetable/GetSlotsByDay';
import { invalidateWeeklyWashing } from './Timetable/GetWashingByWeek';
import { modals } from '@mantine/modals';

export type ReservationType = Unpacked<
  Database['public']['Tables']['reservations']['Row']
>;

export const removeReservation = (reservationId: number) => {
  modals.openConfirmModal({
    title: 'Potrdi izbris termina',
    centered: true,
    children: (
      <Text size="sm">
        Rezervacija bo izbrisana, termin pa bo prost za ostale.
      </Text>
    ),
    labels: { confirm: 'Confirm', cancel: 'Cancel' },
    onCancel: () => console.log('Cancel'),
    onConfirm: () => {
      supabaseClient
        .from('reservations')
        .delete()
        .eq('id', reservationId)
        .select('*')
        .single()
        .then((data) => {
          if (data.error) {
            notifications.show({
              title: 'Error',
              color: 'red',
              autoClose: 1500,
              message: <Text>Izbris ni mogoč {data.error.message}</Text>,
            });
          }

          if (data.data != null) {
            notifications.show({
              title: 'Izbrisano',
              color: 'green',
              autoClose: 1500,
              message: <Text>Termin odstranjen</Text>,
            });
            invalidateWeeklyWashing();
            invalidateDailyWashing();
            invalidateUserReservations();
          }
        });
    },
  });
};
