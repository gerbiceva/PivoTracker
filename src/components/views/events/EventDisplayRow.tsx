import {
  Badge,
  Group,
  Stack,
  ThemeIcon,
  Title,
  Text,
  Divider,
  UnstyledButton,
} from '@mantine/core';
import { Dayjs } from 'dayjs';
import { ReadTimeFromUTCString } from '../../../utils/timeUtils';
import { useNavigate } from 'react-router-dom';
import { Database } from '../../../supabase/supabase';
import { EventStatus, relativeLabel } from './studyYear';

export type GerbaEvent = Database['public']['Tables']['events']['Row'];

interface EventDisplayRowProps {
  event: GerbaEvent;
  status?: EventStatus;
  // When set, a chip with the time relative to `now` is shown
  now?: Dayjs;
}

export const EventDisplayRow = ({
  event,
  status = 'future',
  now,
}: EventDisplayRowProps) => {
  const navigate = useNavigate();
  const date = ReadTimeFromUTCString(event.event_date).local();
  const isPast = status === 'past';
  const isToday = status === 'today';

  return (
    <UnstyledButton
      key={event.id}
      onClick={() => {
        navigate(`/events/${event.id}`);
      }}
      w="100%"
      p="xs"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        backgroundColor: isToday
          ? 'var(--mantine-color-cyan-light)'
          : undefined,
      }}
    >
      <Group
        w="100%"
        gap="xl"
        wrap="nowrap"
        style={{
          textOverflow: 'ellipsis',
        }}
      >
        <ThemeIcon
          variant={isToday ? 'filled' : 'light'}
          color={isPast ? 'gray' : 'cyan'}
          p="sm"
          size="xl"
          visibleFrom="sm"
        >
          <Text fw="bold" size="xl">
            {date.format('DD')}
          </Text>
        </ThemeIcon>
        <Divider orientation="vertical" visibleFrom="sm" />
        <Stack gap="0">
          <Group wrap="nowrap" gap="0">
            <Text
              size="lg"
              fw="bold"
              c={isPast ? 'dimmed' : 'cyan'}
              hiddenFrom="sm"
              px="0"
              mx="0"
              pr="1ch"
            >
              {date.format('DD.')}
            </Text>
            <Text size="md" c="dimmed" px="0" mx="0">
              {date.format('dddd')}
            </Text>
          </Group>
          <Text size="md" c={isPast ? 'dimmed' : undefined}>
            {date.format('HH:mm')} h
          </Text>
        </Stack>
        <Divider orientation="vertical" />
        <Stack gap="0" style={{ flex: 1, minWidth: 0 }}>
          <Title order={3} c={isPast ? 'dimmed' : undefined}>
            {event.title}
          </Title>
          <Text c="dimmed" truncate>
            {event.subtitle}
          </Text>
        </Stack>
        {now && (
          <Badge
            variant={isToday ? 'filled' : 'light'}
            color={isPast ? 'gray' : isToday ? 'cyan' : 'orange'}
            size="lg"
            style={{ flexShrink: 0 }}
            visibleFrom="xs"
          >
            {isToday ? 'Danes' : relativeLabel(date, now)}
          </Badge>
        )}
      </Group>
    </UnstyledButton>
  );
};
