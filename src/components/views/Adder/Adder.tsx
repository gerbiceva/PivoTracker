import {
  Alert,
  Button,
  LoadingOverlay,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { Tables } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { NameCombobox } from './NameCombobox';

// SELECT c.fullname, t.ordered_at, t.ordered, t.paid FROM customers AS c LEFT JOIN transactions AS t ON c.id = t.customer_id;
// SELECT c.fullname, SUM(t.paid) FROM customers AS c LEFT JOIN transactions AS t ON c.id = t.customer_id GROUP BY c.fullname;

interface Order {
  user: Tables<'customers'> | null;
  order: number;
  paid: number;
}

const addOrder = ({ user, order, paid }: Order) => {
  const ordered = order;
  const offset = 10;
  paid = paid * offset; // max ena decimalka, zato množimo z 10
  return new Promise<void>((resolve, reject) => {
    supabaseClient
      .from('transactions')
      .insert({ customer_id: user?.id || -1, ordered, paid })
      .then((res) => {
        if (res.error) {
          console.log(res.error);
          notifications.show({
            title: 'Error',
            color: 'red',
            message: 'Ni uspelo dodati piva' + res.error.message,
          });
          return reject();
        }

        notifications.show({
          title: 'Success',
          color: 'green',
          message: 'Pivo uspešno dodano',
        });
        resolve();
      });
  });
};

export const BeerAdded = () => {
  const form = useForm<Order>({
    initialValues: {
      user: null,
      order: 1,
      paid: 1,
    },

    validate: {
      // fullname: (value) =>  > 0 ? null : 'Število naročenih piv ne sme biti 0',
      paid: (value) =>
        value >= 0
          ? null
          : 'Število plačanih piv ne sme biti negativno število',
    },
  });

  useEffect(() => {
    form.setFieldValue('paid', form.values.order * 1.5);
  }, [form.values.order]);

  const [isLoading, setIsLoading] = useState(false);

  const diffFloat = form.values.order * 1.5 - form.values.paid;
  const diff = Math.round(diffFloat * 100) / 100.0;

  function order(order: Order) {
    setIsLoading(true);
    addOrder(order).finally(() => {
      setIsLoading(false);
      form.reset();
      form.setValues({
        user: null,
        order: 1,
        paid: 1,
      });
    });
  }

  const focusTrapRef = useFocusTrap();

  return (
    // <form onSubmit={form.onSubmit(order)}>
    <Paper withBorder w="100%" pos="relative" shadow="sm">
      <SimpleGrid w="100%" p="md" cols={{ md: 2, xs: 1 }}>
        <Stack style={{ flex: 1 }} ref={focusTrapRef}>
          <Title order={2}>Dodajanje bjre</Title>
          <NameCombobox
            value={form.getInputProps('user').value}
            onChange={form.getInputProps('user').onChange}
          />
          <SimpleGrid cols={{ md: 2, sm: 1 }}>
            <NumberInput
              label="Število piv"
              placeholder="3"
              {...form.getInputProps('order')}
            />
            <NumberInput
              label="Plačano"
              placeholder="vsa"
              min={0}
              rightSection="€"
              {...form.getInputProps('paid')}
            />
          </SimpleGrid>
          <Button
            my="xl"
            size="lg"
            fullWidth
            type="submit"
            variant="gradient"
            disabled={form.values.user == null}
          >
            Dodaj
          </Button>
        </Stack>
        <Alert
          variant="light"
          px="xl"
          h="100%"
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
          display="flex"
          color={diff > 0 ? 'red' : 'green'}
        >
          <Stack gap="xs" h="100%">
            <Text size="xl">
              Dobi <b> {form.values.order} </b> 🍺.
            </Text>
            <Text size="xl">
              Plača <b> {form.values.paid} </b> 💰.
            </Text>
            {diff > 0 ? (
              <Text c="red" size="xl">
                Puf: <b> {Math.abs(diff)} </b> €.{' '}
              </Text>
            ) : (
              <Text c="green" size="xl">
                {' '}
                Bonus: <b> {Math.abs(diff)} </b> €.
              </Text>
            )}
          </Stack>
        </Alert>
      </SimpleGrid>

      <LoadingOverlay
        visible={isLoading}
        overlayProps={{ radius: 'sm', blur: 2 }}
      ></LoadingOverlay>
    </Paper>
    // </form>
  );
};
