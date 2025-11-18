import {
  Group,
  Stack,
  ThemeIcon,
  Title,
  Text,
  Divider,
  UnstyledButton,
} from '@mantine/core';
import { ReadTimeFromUTCString } from '../../../utils/timeUtils';
import { useNavigate } from 'react-router-dom';
import { Database } from '../../../supabase/supabase';

export type GerbaEvent = Database['public']['Tables']['events']['Row'];

interface EventDisplayRowProps {
  event: GerbaEvent;
}

export const EventDisplayRow = ({ event }: EventDisplayRowProps) => {
  const navigate = useNavigate();

  return (
    <UnstyledButton
      key={event.id}
      onClick={() => {
        navigate(`/events/${event.id}`);
      }}
      w="100%"
    >
      <Group
        w="100%"
        gap="xl"
        wrap="nowrap"
        style={{
          textOverflow: 'ellipsis',
        }}
      >
        <ThemeIcon variant="light" p="sm" size="xl" visibleFrom="sm">
          <Text fw="bold" size="xl">
            {ReadTimeFromUTCString(event.event_date).local().format('DD')}
          </Text>
        </ThemeIcon>
        <Divider orientation="vertical" visibleFrom="sm" />
        <Stack gap="0">
          <Group wrap="nowrap" gap="0">
            <Text
              size="lg"
              fw="bold"
              c="cyan"
              hiddenFrom="sm"
              px="0"
              mx="0"
              pr="1ch"
            >
              {ReadTimeFromUTCString(event.event_date).local().format('DD.')}
            </Text>
            <Text size="md" c="dimmed" px="0" mx="0">
              {ReadTimeFromUTCString(event.event_date).local().format('dddd')}
            </Text>
          </Group>
          <Text size="md">
            {ReadTimeFromUTCString(event.event_date).local().format('HH:mm')} h
          </Text>
        </Stack>
        <Divider orientation="vertical" />
        <Stack gap="0">
          <Title order={3}>{event.title}</Title>
          <Text c="dimmed">{event.subtitle}</Text>
        </Stack>
      </Group>
    </UnstyledButton>
  );
};
