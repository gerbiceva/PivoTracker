import {
  Button,
  Group,
  NumberInput,
  Paper,
  Stack,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconBeer, IconCurrencyEuro } from '@tabler/icons-react';
import { nabava, useAddNabava } from './UseGetNabava';

export const NabavaAdder = () => {
  const focusTrapRef = useFocusTrap();
  const { add, isLoading } = useAddNabava();

  const form = useForm<nabava>({
    initialValues: {
      price: 0,
      beer_count: 0,
      notes: '',
    },

    validate: {
      price: (value) => (value >= 0 ? null : 'Cena mora biti pozitivno'),
      beer_count: (value) =>
        value >= 0 ? null : 'Število piv mora biti pozitivno',
    },
  });

  return (
    <form
      onSubmit={form.onSubmit((data) => {
        add(data).then(() => {
          notifications.show({
            title: 'Nabava dodana',
            message: 'Nabava je bila uspešno dodana',
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
            {...form.getInputProps('beer_count')}
          />
          <NumberInput
            label="Cena nakupa"
            withAsterisk
            placeholder="30"
            leftSection={<IconCurrencyEuro />}
            {...form.getInputProps('price')}
          />
          <Textarea
            label="opombe"
            placeholder="Kraj nabave, imena sodelujočih, ..."
            {...form.getInputProps('notes')}
          />
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
