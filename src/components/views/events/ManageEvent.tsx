import {
  Button,
  Container,
  Group,
  Input,
  LoadingOverlay,
  Paper,
  Stack,
  TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useStore } from '@nanostores/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  IconArrowLeft,
  IconCalendar,
  IconCalendarPlus,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { $currUser } from '../../../global-state/user';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { RichTextEditor } from './RichTextEditor';
import { PageHeader } from '../Admin/PageHeader';

dayjs.extend(utc);

interface ManageEventProps {
  // 0 or missing creates a new event
  eventId?: number;
  onSaved?: () => void;
}

// Standalone page for /events/create and /events/edit/:id
export const ManageEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const eventId = id ? parseInt(id) : 0;
  return (
    <Container size="md">
      <Stack my="xl" gap="lg">
        <PageHeader
          title={eventId ? 'Uredi dogodek' : 'Nov dogodek'}
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
          <ManageEventForm eventId={eventId} />
        </Paper>
      </Stack>
    </Container>
  );
};

// Just the form, without a title, so it also fits in a modal
export const ManageEventForm = ({ eventId = 0, onSaved }: ManageEventProps) => {
  const user = useStore($currUser);

  const form = useForm({
    initialValues: {
      title: '',
      subtitle: '',
      eventDate: '', // Keep as string
      body: '',
    },
    validate: {
      title: (value) => (value.length > 0 ? null : 'Vpiši naslov'),
      subtitle: (value) => (value.length > 0 ? null : 'Vpiši podnaslov'),
      eventDate: (value) =>
        value !== null && value.length > 0 ? null : 'Izberi datum',
      body: (value) => (value.length > 0 ? null : 'Vpiši opis'),
    },
  });

  const { data, isLoading } = getSupaWR({
    query: () =>
      supabaseClient.from('events').select('*').eq('id', eventId).maybeSingle(),
    table: 'events',
    params: ['event', eventId],
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    form.setInitialValues({
      title: data.title,
      subtitle: data.subtitle,
      eventDate: data.event_date, // Keep as string
      body: data.body,
    });
    form.reset();
  }, [data]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!user || !user.base_user_id) {
      notifications.show({
        title: 'Napaka',
        message: 'Za urejanje dogodkov moraš biti prijavljen.',
        color: 'red',
      });
      return;
    }

    let error = null;

    const eventData = {
      title: values.title,
      subtitle: values.subtitle,
      event_date: dayjs(values.eventDate!).utc().toISOString(), // Assert not null, convert to UTC ISO string using dayjs
      body: values.body,
    };

    if (eventId) {
      // Update existing event
      const { error: updateError } = await supabaseClient
        .from('events')
        .update(eventData)
        .eq('id', eventId);
      error = updateError;
    } else {
      // Insert new event
      const { error: insertError } = await supabaseClient
        .from('events')
        .insert([
          {
            ...eventData,
            created_by: user.base_user_id,
          },
        ]);
      error = insertError;
    }
    if (error) {
      notifications.show({
        title: 'Napaka',
        message: error.message,
        color: 'red',
      });
      return;
    }
    notifications.show({
      title: eventId ? 'Posodobljeno' : 'Dodano',
      message: eventId ? 'Dogodek je posodobljen' : 'Dogodek je dodan',
      color: 'green',
    });
    if (eventId) {
      // keep the saved values as the new baseline
      form.setInitialValues(values);
      form.reset();
    } else {
      form.reset();
    }
    onSaved?.();
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <LoadingOverlay visible={isLoading} />
      <Stack gap="lg">
        <TextInput
          label="Naslov"
          placeholder="npr. Brucovanje"
          withAsterisk
          {...form.getInputProps('title')}
        />
        <TextInput
          label="Podnaslov"
          placeholder="Kratek opis v eni vrstici"
          withAsterisk
          {...form.getInputProps('subtitle')}
        />
        <DateTimePicker
          label="Datum in ura"
          placeholder="Izberi datum in uro"
          valueFormat="D. M. YYYY, HH:mm"
          leftSection={<IconCalendar size={16} />}
          withAsterisk
          {...form.getInputProps('eventDate')}
        />
        <Input.Wrapper label="Opis" withAsterisk error={form.errors.body}>
          <RichTextEditor
            value={form.values.body}
            onChange={(value) => form.setFieldValue('body', value)}
          />
        </Input.Wrapper>
        <Group justify="flex-end">
          <Button
            type="submit"
            disabled={!form.isDirty()}
            loading={form.submitting}
            leftSection={
              eventId ? (
                <IconDeviceFloppy size={16} />
              ) : (
                <IconCalendarPlus size={16} />
              )
            }
          >
            {eventId ? 'Shrani spremembe' : 'Ustvari dogodek'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
