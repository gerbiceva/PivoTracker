import { ActionIcon, Button, Text, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabaseClient } from '../../../../supabase/supabaseClient';

interface DeleteUserButtonProps {
  userId: number;
  name: string;
  onDeleted: () => void;
  // full text button (drawer) instead of the table's trash icon
  asButton?: boolean;
}

// edge function errors carry a { error } JSON body; surface that message
const errorMessage = async (error: unknown) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.error) return body.error as string;
    } catch {
      /* fall through */
    }
  }
  return error instanceof Error ? error.message : String(error);
};

export const DeleteUserButton = ({
  userId,
  name,
  onDeleted,
  asButton,
}: DeleteUserButtonProps) => {
  const deleteUser = async () => {
    const { error } = await supabaseClient.functions.invoke('delete-user', {
      body: { base_user_id: userId },
    });
    if (error) {
      notifications.show({
        color: 'red',
        title: 'Brisanje ni uspelo',
        message: await errorMessage(error),
      });
      return;
    }
    notifications.show({
      color: 'green',
      title: 'Uporabnik izbrisan',
      message: name,
    });
    onDeleted();
  };

  const confirm = () =>
    modals.openConfirmModal({
      title: 'Izbriši uporabnika',
      children: (
        <Text size="sm">
          Ali res želiš trajno izbrisati uporabnika <b>{name}</b>? Izbrisani
          bodo tudi prijava, dovoljenja in obljube. Tega ni mogoče razveljaviti.
        </Text>
      ),
      labels: { confirm: 'Izbriši', cancel: 'Prekliči' },
      confirmProps: { color: 'red' },
      onConfirm: deleteUser,
    });

  if (asButton) {
    return (
      <Button size="xs" variant="outline" color="red" onClick={confirm}>
        Izbriši uporabnika
      </Button>
    );
  }

  return (
    <Tooltip label="Izbriši uporabnika">
      <ActionIcon
        variant="subtle"
        color="red"
        onClick={(e) => {
          e.stopPropagation();
          confirm();
        }}
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Tooltip>
  );
};
