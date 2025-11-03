import {
  TextInput,
  Button,
  Stack,
  Paper,
  Title,
  LoadingOverlay,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { useEffect } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';

export const EditUserBaseInfo = ({ userId }: { userId: number }) => {
  const {
    data: user,
    error,
    isLoading,
  } = getSupaWR({
    query: () => supabaseClient.from('').select('*'),
    table: 'base_users',
    params: [userId],
  });

  console.log({ user });

  const form = useForm({
    initialValues: {
      name: '',
      surname: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.setValues({
        name: user.name || '',
        surname: user.surname || '',
      });
    }
  }, [user]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!userId) return;
    await supabaseClient.from('base_users').update(values).eq('id', userId);
  };

  if (error) {
    return (
      <Alert title="Error loading user" icon={<IconAlertCircle />}>
        {error.message}
      </Alert>
    );
  }

  return (
    <Paper withBorder p="md" style={{ position: 'relative' }}>
      <LoadingOverlay visible={isLoading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Title order={3}>Base Information</Title>
          <TextInput label="Name" {...form.getInputProps('name')} />
          <TextInput label="Surname" {...form.getInputProps('surname')} />
          <Button type="submit">Save</Button>
        </Stack>
      </form>
    </Paper>
  );
};
