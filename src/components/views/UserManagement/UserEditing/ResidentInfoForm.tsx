import {
  TextInput,
  Button,
  Stack,
  LoadingOverlay,
  Alert,
  Group,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { useEffect } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';

interface ResidentInfoFormProps {
  baseUserId: number;
}

export const ResidentInfoForm = ({ baseUserId }: ResidentInfoFormProps) => {
  const {
    data: resident,
    error,
    isLoading,
  } = getSupaWR({
    query: () =>
      supabaseClient
        .from('user_view')
        .select('*')
        .filter('base_user_id', 'eq', baseUserId)
        .single(),
    table: 'residents',
    params: [baseUserId],
  });

  const form = useForm({
    initialValues: {
      room: '',
      phone_number: '',
      birth_date: new Date(),
    },
  });

  useEffect(() => {
    if (resident) {
      form.setInitialValues({
        room: resident.room?.toString() || '',
        phone_number: resident.phone_number || '',
        birth_date: new Date(resident.birth_date || ''),
      });
      form.reset();
    }
  }, [resident]);

  const handleSubmit = async (values: typeof form.values) => {
    if (resident?.resident_id) {
      await supabaseClient
        .from('residents')
        .update({
          room: Number(values.room),
          phone_number: values.phone_number,
          birth_date: new Date(values.birth_date).toISOString(),
        })
        .eq('id', resident.resident_id);

      form.reset();
      form.setValues({
        ...values,
      });
      form.resetDirty();
    }
  };

  if (error) {
    return (
      <Alert title="Error loading resident info" icon={<IconAlertCircle />}>
        {error.message}
      </Alert>
    );
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack style={{ position: 'relative' }}>
        <Text size="xs" fw="bold" c="dimmed" mt="xl">
          INFORMACIJE PREBIVALCA
        </Text>
        <Group>
          <TextInput description="Room" {...form.getInputProps('room')} />
          <TextInput
            description="Phone Number"
            {...form.getInputProps('phone_number')}
          />
        </Group>
        <Group>
          <DateInput
            description="Birth Date"
            {...form.getInputProps('birth_date')}
          />
        </Group>
        <LoadingOverlay visible={isLoading} />

        <div>
          <Button
            size="xs"
            variant="light"
            type="submit"
            disabled={!form.isDirty()}
          >
            Shrani informacije prebivalca
          </Button>
        </div>
      </Stack>
    </form>
  );
};
