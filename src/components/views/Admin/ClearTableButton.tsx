import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrashX } from '@tabler/icons-react';
import { useState } from 'react';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import {
  refetchTables,
  TableName,
} from '../../../supabase/supa-utils/supaSWRCache';
import { supabaseClient } from '../../../supabase/supabaseClient';

// admin is the dev-only vloga, not a permission, so ask the DB directly
export const useIsAdmin = () => {
  const { data } = getSupaWR({
    query: () => supabaseClient.rpc('current_user_is_admin'),
    table: ['permission_groups', 'user_view'],
    params: ['is-admin'],
  });
  return data === true;
};

// tables admin_clear_table accepts, and what else each one empties
const CLEARS: Record<string, TableName[]> = {
  obljube: ['obljube', 'obljube_poplacila', 'obljube_with_user_info'],
  transactions: ['transactions', 'obljube_poplacila', 'named_transactions'],
  events: ['events'],
};

const CONFIRM_WORD = 'IZBRIŠI';

interface ClearTableButtonProps {
  table: 'obljube' | 'transactions' | 'events';
  // what gets deleted, e.g. "vse obljube"
  what: string;
  // extra consequences shown in the confirmation
  note?: string;
  onCleared?: () => void;
}

// Admin-only button that deletes every row of a table, behind a typed
// confirmation. Renders nothing for everyone else.
export const ClearTableButton = ({
  table,
  what,
  note,
  onCleared,
}: ClearTableButtonProps) => {
  const isAdmin = useIsAdmin();
  const [opened, setOpened] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isAdmin) return null;

  const close = () => {
    setOpened(false);
    setTyped('');
  };

  const clear = async () => {
    setBusy(true);
    const { error } = await supabaseClient.rpc('admin_clear_table', {
      p_table: table,
    });
    setBusy(false);
    if (error) {
      notifications.show({
        color: 'red',
        title: 'Brisanje ni uspelo',
        message: error.message,
      });
      return;
    }
    notifications.show({
      color: 'green',
      message: `Izbrisano: ${what}.`,
    });
    refetchTables(CLEARS[table]);
    onCleared?.();
    close();
  };

  return (
    <>
      <Button
        variant="outline"
        color="red"
        leftSection={<IconTrashX size={16} />}
        onClick={() => setOpened(true)}
      >
        Izbriši vse
      </Button>
      <Modal opened={opened} onClose={close} title={`Izbriši ${what}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (typed === CONFIRM_WORD) clear();
          }}
        >
          <Stack>
            <Text size="sm">
              To trajno izbriše {what}. Tega ni mogoče razveljaviti.
            </Text>
            {note && (
              <Text size="sm" c="dimmed">
                {note}
              </Text>
            )}
            <TextInput
              label={`Za potrditev vpiši ${CONFIRM_WORD}`}
              value={typed}
              onChange={(e) => setTyped(e.currentTarget.value)}
              autoComplete="off"
              data-autofocus
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={close}>
                Prekliči
              </Button>
              <Button
                type="submit"
                color="red"
                loading={busy}
                disabled={typed !== CONFIRM_WORD}
              >
                Izbriši vse
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
};
