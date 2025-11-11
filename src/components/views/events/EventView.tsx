import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseClient } from '../../../supabase/supabaseClient';
import {
  Container,
  Title,
  Text,
  Stack,
  LoadingOverlay,
  Alert,
  Group,
  Button,
  Divider,
} from '@mantine/core';
import { IconAlertCircle, IconEdit } from '@tabler/icons-react';
import { ReadTimeFromUTCString } from '../../../utils/timeUtils';
import { PermissionPath } from '../../PermissionPath';
import { GerbaEvent } from './EventDisplayRow';

export const EventView = () => {
  const { id } = useParams();
  const eventId = id ? parseInt(id) : null;
  const navigate = useNavigate();
  const [event, setEvent] = useState<GerbaEvent>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setError('Event ID is missing.');
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) {
        setError(error.message);
        alert('Error fetching event: ' + error.message);
      } else if (data) {
        setEvent(data);
      }
      setLoading(false);
    };

    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <Container size="xl" mt="xl">
        <LoadingOverlay visible={true} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" mt="xl">
        <Alert
          variant="outline"
          title="Napaka"
          icon={<IconAlertCircle></IconAlertCircle>}
        >
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container size="xl" mt="xl">
        <Alert variant="outline" title="Dogodek ni najden" color="yellow">
          <p>Dogodek s tem ID-jem ne obstaja.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" mt="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Stack>
            <Title order={1}>{event.title}</Title>
            <Title order={4}>{event.subtitle}</Title>
          </Stack>
          <PermissionPath permission="MANAGE_EVENTS">
            <Button
              leftSection={<IconEdit size={14} />}
              onClick={() => navigate(`/events/edit/${event.id}`)}
            >
              Edit Event
            </Button>
          </PermissionPath>
        </Group>
        <Text c="dimmed" size="sm">
          {ReadTimeFromUTCString(event.event_date)
            .local()
            .format('DD.MM.YYYY HH:mm')}
        </Text>
        <Divider />
        <Text dangerouslySetInnerHTML={{ __html: event.body }} />
      </Stack>
    </Container>
  );
};
