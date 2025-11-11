import { useEffect, useState } from 'react';
import {
  TextInput,
  Button,
  Stack,
  Title,
  Container,
  Group,
  LoadingOverlay,
  Alert,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { RichTextEditor } from './RichTextEditor';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { $currUser } from '../../../global-state/user';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

dayjs.extend(utc);

export const ManageEvent = () => {
  const { id } = useParams();
  const eventId = id ? parseInt(id) : 0;
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

  const { data, error, isLoading } = getSupaWR({
    query: () =>
      supabaseClient.from('events').select('*').eq('id', eventId).maybeSingle(),
    table: 'events',
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
    notifications.show({
      title: 'Posodobljeno',
      message: 'Event je posodobljen',
      color: 'green',
    });
    form.reset();
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
