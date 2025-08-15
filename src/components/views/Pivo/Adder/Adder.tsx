import {
  ActionIcon,
  Alert,
  Button,
  Group,
  LoadingOverlay,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Tooltip,
  Text,
  Title,
  Fieldset,
  Center,
  Grid,
  useMatches,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { Tables } from '../../../../supabase/supabase';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { NameCombobox } from './NameCombobox';
import { useNavigate } from 'react-router-dom';
import { IconCalculator } from '@tabler/icons-react';
import { ItemSelect } from './ItemSelect';

// SELECT c.fullname, t.ordered_at, t.ordered, t.paid FROM customers AS c LEFT JOIN transactions AS t ON c.id = t.customer_id;
// SELECT c.fullname, SUM(t.paid) FROM customers AS c LEFT JOIN transactions AS t ON c.id = t.customer_id GROUP BY c.fullname;

interface Order {
  user: Tables<'customers'> | null;
  item: Tables<'items'> | undefined;
  order: number;
  paid: number;
}

const addOrder = (
  { user, order, paid, item }: Order,
  navigate: (url: string) => void,
) => {
  const ordered = order;
  return new Promise<void>((resolve, reject) => {
    console.log('add order', item?.id);
    if (!user || !item) {
      console.error('No user or item');
      return;
    }

    supabaseClient
      .from('transactions')
      .insert({
        customer_id: user.id,
        ordered,
        paid,
        item: item.id,
      })
      .then((res) => {
        if (res.error) {
          console.log(res.error);
          notifications.show({
            title: 'Error',
            color: 'red',
            autoClose: 1000,
            message: <Text>Ni uspelo dodati piva + {res.error.message}</Text>,
          });
          return reject();
        }

        notifications.show({
          title: 'Success',
          color: 'green',
          autoClose: 4000,

          message: (
            <Stack>
              <Text>Uspešno dodano pivo</Text>
              <Button
                onClick={() => {
                  navigate(`/user/${user.id}`);
                }}
              >
                Preglej uporabnika
              </Button>
            </Stack>
          ),
        });
        resolve();
      });
  });
};

export const BeerAdded = () => {
  const navigate = useNavigate();
  const cols = useMatches({
    base: 3,
    sm: 1,
  });
  const form = useForm<Order>({
    initialValues: {
      user: null,
      order: 1,
      paid: 0,
      item: undefined,
    },

    validate: {
      // fullname: (value) =>  > 0 ? null : 'Število naročenih piv ne sme biti 0',
      paid: (value) =>
        value >= 0
          ? null
          : 'Število plačanih piv ne sme biti negativno število',
    },
  });

  // const [selectedItem, setSelectedItem] = useState<Tables<'items'>>();
  const price = form.values.item?.price || 0;

  const [isLoading, setIsLoading] = useState(false);

  const diff = form.values.order * price - form.values.paid;

  function order(order: Order) {
    setIsLoading(true);
    addOrder(order, navigate).finally(() => {
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
    <Center w="100%" h="100%">
      <form onSubmit={form.onSubmit(order)}>
        <Stack>
          <Title order={1}>Prodaja piva</Title>

          <Paper withBorder w="100%" pos="relative" shadow="lg">
            <Grid w="100%" p="md" columns={cols}>
              <Grid.Col span={2}>
                <Stack style={{ flex: 1 }} ref={focusTrapRef} gap="lg">
                  {/* <Title order={2}>Prodaja piva</Title> */}
                  <NameCombobox
                    value={form.getInputProps('user').value}
                    onChange={form.getInputProps('user').onChange}
                  />
                  <ItemSelect
                    label="Artikel"
                    value={form.values.item}
                    onChange={(item) => {
                      form.setFieldValue('item', item);
                    }}
                  />
                  <SimpleGrid cols={{ md: 2, sm: 1 }} spacing="xl">
                    <Fieldset legend="Naročeno" variant="unstyled">
                      <NumberInput
                        // label="Število piv"
                        placeholder="3"
                        {...form.getInputProps('order')}
                      />
                    </Fieldset>

                    <Fieldset legend="Plačano" variant="unstyled">
                      <Group wrap="nowrap" align="center">
                        <NumberInput
                          placeholder="vsa"
                          min={0}
                          rightSection="€"
                          {...form.getInputProps('paid')}
                        />
                        <Tooltip label="Izračunaj ceno  ">
                          <ActionIcon
                            variant="light"
                            size="lg"
                            onClick={() => {
                              form.setValues({
                                paid: price * form.values.order,
                              });
                            }}
                          >
                            <IconCalculator />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Fieldset>
                  </SimpleGrid>
                  <Button
                    my="xl"
                    size="lg"
                    fullWidth
                    type="submit"
                    variant="gradient"
                    disabled={
                      form.values.user == null || form.values.item == undefined
                    }
                  >
                    Dodaj
                  </Button>
                </Stack>
              </Grid.Col>
              <Grid.Col span={1}>
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
                      Dobi{' '}
                      <b>
                        {' '}
                        {form.values.order *
                          (form.values.item?.beer_count || 1)}{' '}
                      </b>{' '}
                      🍺.
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
              </Grid.Col>
            </Grid>

            <LoadingOverlay
              visible={isLoading}
              overlayProps={{ radius: 'sm', blur: 2 }}
            ></LoadingOverlay>
          </Paper>
        </Stack>
      </form>
    </Center>
  );
};
