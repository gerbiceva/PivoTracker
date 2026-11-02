import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { refetchTables } from '../../../supabase/supa-utils/supaSWRCache';

// Asks for confirmation, then deletes the event (requires MANAGE_EVENTS via RLS)
export const deleteEvent = (
  event: { id: number; title: string },
  onDeleted?: () => void,
) => {
  modals.openConfirmModal({
    title: 'Potrdi izbris dogodka',
    centered: true,
    children: (
      <Text size="sm">
        Dogodek <b>{event.title}</b> bo trajno izbrisan.
      </Text>
    ),
    labels: { confirm: 'Izbriši', cancel: 'Prekliči' },
    confirmProps: { color: 'red' },
    onConfirm: async () => {
      // select() so an RLS-blocked delete (0 rows) shows up as an error
      const { error } = await supabaseClient
        .from('events')
        .delete()
        .eq('id', event.id)
        .select('id')
        .single();

      if (error) {
        notifications.show({
          title: 'Napaka',
          color: 'red',
          message: `Izbris ni mogoč: ${error.message}`,
        });
        return;
      }

      notifications.show({
        title: 'Izbrisano',
        color: 'green',
        message: 'Dogodek je izbrisan',
      });
      refetchTables('events');
      onDeleted?.();
    },
  });
};
