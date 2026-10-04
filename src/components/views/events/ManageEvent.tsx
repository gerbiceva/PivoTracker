import {
  Button,
  Group,
  LoadingOverlay,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useStore } from '@nanostores/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { $currUser } from '../../../global-state/user';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { RichTextEditor } from './RichTextEditor';

dayjs.extend(utc);

interface ManageEventProps {
  // overrides the :id route param, e.g. when used inside a modal
  eventId?: number;
  onSaved?: () => void;
}

export const ManageEvent = ({
  eventId: eventIdProp,
  onSaved,
}: ManageEventProps = {}) => {
  const { id } = useParams();
  const eventId = eventIdProp ?? (id ? parseInt(id) : 0);
  const user = useStore($currUser);

  const form = useForm({
    initialValues: {
      title: '',
      subtitle: '',
      eventDate: '', // Keep as string
      body: '',
    },
    validate: {
      title: (value) => (value.length > 0 ? null : 'Title is required'),
      subtitle: (value) => (value.length > 0 ? null : 'Subtitle is required'),
      eventDate: (value) =>
        value !== null && value.length > 0 ? null : 'Event date is required', // Validate string length
      body: (value) => (value.length > 0 ? null : 'Body is required'),
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
      alert('You must be logged in to manage events.');
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

      {/* {error && (
        <Alert title="Napaka" icon={<IconAlertCircle></IconAlertCircle>}>
          {error.message}
        </Alert>
      )} */}

      <Stack gap="xl">
        <Title>
          {eventId ? `Uredi Event: ${form.values.title}` : 'Dodaj event'}
        </Title>
        <TextInput
          label="Title"
          placeholder="Event title"
          {...form.getInputProps('title')}
          required
        />
        <TextInput
          label="Subtitle"
          placeholder="Podnaslov dogodka"
          {...form.getInputProps('subtitle')}
          required
        />
        <DateTimePicker
          label="Event Date"
          placeholder="Pick date and time"
          {...form.getInputProps('eventDate')}
        />
        <RichTextEditor
          value={form.values.body}
          onChange={(value) => form.setFieldValue('body', value)}
        />
        <Group ml="auto">
          <Button type="submit" mt="md" disabled={!form.isDirty()}>
            {eventId ? 'Save Changes' : 'Create Event'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
