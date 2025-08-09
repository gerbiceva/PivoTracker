import { Modal, Button, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { CalendarDay } from './WashingTimetable';

export interface WashingModalProps {
  day: CalendarDay;
}

export const AddWashingModal = ({ day }: WashingModalProps) => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal opened={opened} onClose={close} size="xl" centered>
        <Stack>{Array(8)}</Stack>
      </Modal>

      <Button
        mt="xl"
        fullWidth
        variant="light"
        size="xs"
        onClick={open}
        leftSection={<IconPlus size="1rem"></IconPlus>}
      >
        Dodaj termin
      </Button>
    </>
  );
};
