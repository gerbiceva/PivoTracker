import { ActionIcon, Button, Group } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';

interface ConfirmProps {
  callback: () => any;
}

export const ConfirmAdd = ({ callback }: ConfirmProps) => {
  const [confirm, setConfirm] = useState<'add' | 'confirm'>('add');

  return (
    <div>
      {confirm == 'add' ? (
        <ActionIcon
          size="lg"
          onClick={() => {
            setConfirm('confirm');
          }}
        >
          <IconPlus />
        </ActionIcon>
      ) : (
        <Group>
          <Button
            color="green"
            size="xs"
            onClick={() => {
              callback();
              setConfirm('add');
            }}
          >
            Potrdi
          </Button>
          <Button
            color="gray"
            size="xs"
            onClick={() => {
              setConfirm('add');
            }}
          >
            Cancel
          </Button>
        </Group>
      )}
    </div>
  );
};
