import {
  ActionIcon,
  Button,
  Group,
  LoadingOverlay,
  NumberInput,
  SimpleGrid,
  Stack,
  Tooltip,
  Text,
  Title,
  Fieldset,
  Center,
  Grid,
  useMatches,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { Database, Tables } from '../../../../supabase/supabase';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { NameCombobox } from './NameCombobox';
import { useNavigate } from 'react-router-dom';
import { IconCalculator } from '@tabler/icons-react';
import { ItemSelect } from './ItemSelect';

interface Order {
  user: Database['public']['Views']['user_view']['Row'] | null;
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
        customer_id: user.base_user_id!,
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
                  navigate(`/user/${user.base_user_id}`);
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
    base: 1,
    md: 3,
  });
  console.log({ cols });

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
        <Stack w="100%">
          <Title order={1}>Prodaja piva</Title>

          <Grid p="md" columns={cols} w="100%">
            <Grid.Col span={cols == 3 ? 2 : 1}>
              <Stack ref={focusTrapRef} gap="lg">
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
                      <NumberInput
                        placeholder="vsa"
                        min={0}
                        rightSection="€"
                        {...form.getInputProps('paid')}
                      />
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
                      {form.values.order * (form.values.item?.beer_count || 1)}
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
          />
        </Stack>
      </form>
    </Center>
  );
};
