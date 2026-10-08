import {
  TextInput,
  Button,
  Stack,
  LoadingOverlay,
  Alert,
  Group,
  Text,
  SimpleGrid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { useEffect, useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { refetchTables } from '../../../../supabase/supa-utils/supaSWRCache';

interface ResidentInfoFormProps {
  baseUserId: number;
  withTitle?: boolean;
  // open the create form right away when the user has no resident row
  startCreating?: boolean;
}

export const ResidentInfoForm = ({
  baseUserId,
  withTitle = true,
  startCreating = false,
}: ResidentInfoFormProps) => {
  const [showCreateForm, setShowCreateForm] = useState(startCreating);
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
    table: ['residents'],
    params: [baseUserId],
  });

  const form = useForm({
    initialValues: {
      room: '',
      phone_number: '',
      birth_date: null as Date | null,
    },
  });

  useEffect(() => {
    if (resident?.resident_id) {
      form.setInitialValues({
        room: resident.room?.toString() || '',
        phone_number: resident.phone_number || '',
        birth_date: resident.birth_date ? new Date(resident.birth_date) : null,
      });
      form.reset();
      setShowCreateForm(false); // Hide create form if resident data is loaded
    }
  }, [resident]);

  const handleSubmit = async (values: typeof form.values) => {
    if (resident?.resident_id) {
      await supabaseClient
        .from('residents')
        .update({
          room: Number(values.room),
          phone_number: values.phone_number,
          birth_date: values.birth_date
            ? new Date(values.birth_date).toISOString()
            : null,
        })
        .eq('id', resident.resident_id);

      form.reset();
      form.setValues({
        ...values,
      });
      form.resetDirty();
      refetchTables('residents');
    } else {
      // Create new resident entry using rpc function
      await supabaseClient.rpc('create_and_link_resident', {
        p_base_user_id: baseUserId,
        p_room: Number(values.room),
        p_phone_number: values.phone_number,
        p_birth_date: values.birth_date
          ? new Date(values.birth_date).toISOString()
          : undefined,
      });
      notifications.show({
        title: 'Podatki dodani',
        message: 'Uporabnik ima podatke o stanovalcu',
      });
      refetchTables('residents');
      form.setInitialValues({
        ...values,
      });
      form.reset();
    }
  };

  const handleDelete = async () => {
    if (resident?.resident_id) {
      await supabaseClient
        .from('residents')
        .delete()
        .eq('id', resident.resident_id);
      refetchTables('residents');
    }
  };

  if (error) {
    return (
      <Alert
        title="Error loading resident info"
        icon={<IconAlertCircle />}
        w="100%"
      >
        {error.message}
      </Alert>
    );
  }

  if (!resident?.resident_id && !showCreateForm) {
    return (
      <Alert
        title="Resident not found"
        color="blue"
        icon={<IconAlertCircle />}
        mt="xl"
        variant="outline"
      >
        <Text>No resident information found for this user.</Text>
        <Button
          mt="md"
          variant="subtle"
          onClick={() => setShowCreateForm(true)}
        >
          Create Resident Entry
        </Button>
      </Alert>
    );
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack style={{ position: 'relative' }} w="100%">
        {withTitle && (
          <Text size="xs" fw="bold" c="dimmed" mt="xl">
            INFORMACIJE PREBIVALCA
          </Text>
        )}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput description="Room" {...form.getInputProps('room')} />
          <TextInput
            description="Phone Number"
            {...form.getInputProps('phone_number')}
          />
          <DateInput
            description="Birth Date"
            {...form.getInputProps('birth_date')}
          />
        </SimpleGrid>
        <LoadingOverlay visible={isLoading} />

        <Group justify="flex-end">
          {resident?.resident_id && (
            <Button
              size="xs"
              variant="outline"
              color="red"
              onClick={() => {
                confirm('Ali ste prepričani?') && handleDelete();
              }}
            >
              Izbriši prebivalca
            </Button>
          )}
          <Button
            size="xs"
            variant="light"
            type="submit"
            disabled={!form.isDirty()}
          >
            {resident?.resident_id
              ? 'Shrani informacije prebivalca'
              : 'Ustvari prebivalca'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
