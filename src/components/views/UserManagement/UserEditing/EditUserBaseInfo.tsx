import {
  TextInput,
  Button,
  Text,
  LoadingOverlay,
  Alert,
  Box,
  Stack,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { useEffect } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';

export const EditUserBaseInfo = ({ userId }: { userId: number }) => {
  const {
    data: user,
    error,
    isLoading,
  } = getSupaWR({
    query: () =>
      supabaseClient
        .from('base_users')
        .select('*')
        .filter('id', 'eq', userId)
        .single(),
    table: 'base_users',
    params: [userId],
  });

  const form = useForm({
    initialValues: {
      name: '',
      surname: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.setInitialValues({
        name: user.name || '',
        surname: user.surname || '',
      });
      form.reset();
    }
  }, [user]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!userId) return;
    try {
      const { error } = await supabaseClient
        .from('base_users')
        .update(values)
        .eq('id', userId);
      if (error) {
        throw error;
      }
      showNotification({
        title: 'Success',
        message: 'User information updated successfully',
        color: 'green',
      });
      form.reset();
      form.setValues({
        ...values,
      });
      form.resetDirty();
    } catch (error) {
      showNotification({
        title: 'Error',
        message: (error as Error).message,
        color: 'red',
      });
    }
  };

  if (error) {
    return (
      <Alert title="Error loading user" icon={<IconAlertCircle />}>
        {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <LoadingOverlay visible={isLoading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Text size="xs" fw="bold" c="dimmed" mt="xl">
            OSEBNE INFORMACIJE
          </Text>
          <Group wrap="wrap">
            <TextInput
              flex={1}
              description="Name"
              {...form.getInputProps('name')}
            />
            <TextInput
              flex={1}
              description="Surname"
              {...form.getInputProps('surname')}
            />
          </Group>

          <div>
            <Button type="submit" size="xs" disabled={!form.isDirty()}>
              Shrani osebne informacije
            </Button>
          </div>
        </Stack>
      </form>
    </Box>
  );
};
