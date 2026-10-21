import {
  Button,
  Container,
  Group,
  NumberInput,
  Paper,
  Stack,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import {
  IconArrowLeft,
  IconBeer,
  IconHeartHandshake,
} from '@tabler/icons-react';
import { NameCombobox } from '../Pivo/Adder/NameCombobox';
import { Database } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { useStore } from '@nanostores/react';
import { $currUser } from '../../../global-state/user';
import { refetchTables } from '../../../supabase/supa-utils/supaSWRCache';
import { PageHeader } from '../Admin/PageHeader';

interface PromiseFormValues {
  user: Database['public']['Views']['user_view']['Row'] | null;
  amount: number;
  reason: string;
}

export const AddPromise = () => {
  const user = useStore($currUser);
  const navigate = useNavigate();

  const form = useForm<PromiseFormValues>({
    initialValues: {
      user: null,
      amount: 1,
      reason: '',
    },
    validate: {
      user: (value) => (value ? null : 'Izberi uporabnika'),
      amount: (value) => (value > 0 ? null : 'Vsaj eno pivo'),
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: PromiseFormValues) => {
    if (!values.user?.base_user_id || !user) {
      notifications.show({
        title: 'Napaka',
        color: 'red',
        message: 'Manjka uporabnik ali minister.',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabaseClient.from('obljube').insert({
      who: values.user.base_user_id,
      minister: user.base_user_id,
      amount: values.amount,
      reason: values.reason,
    });
    setIsLoading(false);

    if (error) {
      notifications.show({
        title: 'Napaka',
        color: 'red',
        message: `Obljube ni bilo mogoče dodati: ${error.message}`,
      });
      return;
    }

    notifications.show({
      title: 'Obljuba dodana',
      color: 'green',
      message: `${values.user.name} ${values.user.surname} dolguje ${values.amount} 🍺`,
    });
    refetchTables('obljube');
    // keep the form open so several can be added in a row
    form.reset();
  };

  return (
    <Container size="sm">
      <Stack my="xl" gap="lg">
        <PageHeader
          title="Nova obljuba"
          description="Zabeleži, koliko piva je kdo obljubil. Obljuba se poplača sama, ko ta oseba kupi pivo."
          action={
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate(-1)}
            >
              Nazaj
            </Button>
          }
        />
        <Paper withBorder radius="md" p={{ base: 'md', sm: 'xl' }}>
          <form onSubmit={form.onSubmit(handleSubmit)} autoComplete="off">
            <Stack gap="lg">
              <NameCombobox
                value={form.values.user}
                onChange={(value) => form.setFieldValue('user', value)}
              />

              <NumberInput
                label="Število piv"
                min={1}
                allowDecimal={false}
                leftSection={<IconBeer size={16} />}
                {...form.getInputProps('amount')}
              />

              <Textarea
                label="Razlog"
                placeholder="npr. Pomagal pri postavljanju šotora"
                autosize
                minRows={3}
                {...form.getInputProps('reason')}
              />

              <Group justify="flex-end">
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={form.values.user == null}
                  leftSection={<IconHeartHandshake size={16} />}
                >
                  Dodaj obljubo
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
};
