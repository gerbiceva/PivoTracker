import { TextInput, Button, Stack, LoadingOverlay, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { useEffect } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';

interface ResidentInfoFormProps {
  residentId: number;
}

export const ResidentInfoForm = ({ residentId }: ResidentInfoFormProps) => {
  const {
    data: resident,
    error,
    isLoading,
  } = getSupaWR({
    query: () =>
      supabaseClient
        .from('residents')
        .select('*')
        .eq('id', residentId)
        .single(),
    table: 'residents',
    params: [residentId],
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
      form.setValues({
        room: resident.room?.toString() || '',
        phone_number: resident.phone_number || '',
        birth_date: new Date(resident.birth_date || ''),
      });
    }
  }, [resident]);

  const handleSubmit = async (values: typeof form.values) => {
    await supabaseClient
      .from('residents')
      .update({
        room: Number(values.room),
        phone_number: values.phone_number,
        birth_date: values.birth_date.toISOString(),
      })
      .eq('id', residentId);
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
        <LoadingOverlay visible={isLoading} />
        <TextInput label="Room" {...form.getInputProps('room')} />
        <TextInput
          label="Phone Number"
          {...form.getInputProps('phone_number')}
        />
        <DateInput label="Birth Date" {...form.getInputProps('birth_date')} />
        <Button type="submit">Save Resident Info</Button>
      </Stack>
    </form>
  );
};
