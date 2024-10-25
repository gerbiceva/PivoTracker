import { Button, Group, NumberInput, Paper, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconBeer } from '@tabler/icons-react';
import { nabava, useRestockMinister } from './UseGetZaloge';

export const ZalogeAdder = () => {
  const focusTrapRef = useFocusTrap();
  const { add, isLoading } = useRestockMinister();

  const form = useForm<nabava>({
    initialValues: {
      beer_count: 0,
      to_minister: '',
    },

    validate: {
      to_minister: (value) =>
        value != undefined ? null : 'Cena mora biti pozitivno',
      beer_count: (value) =>
        value >= 0 ? null : 'Število piv mora biti pozitivno',
    },
  });

  return (
    <form
      onSubmit={form.onSubmit((data) => {
        add(data).then(() => {
          notifications.show({
            title: 'Zaloge',
            message: 'zaloge uspešno prepisane',
          });
        });
        form.reset();
      })}
    >
      <Paper p="md" withBorder shadow="xs">
        <Stack ref={focusTrapRef}>
          <NumberInput
            label="Število piv"
            withAsterisk
            placeholder="20"
            leftSection={<IconBeer />}
            {...form.getInputProps('stevilo_piv')}
          />
          {}
          <Group justify="end">
            <Button type="submit" loading={isLoading} size="lg">
              Dodaj zalogo
            </Button>
          </Group>
        </Stack>
      </Paper>
    </form>
  );
};
