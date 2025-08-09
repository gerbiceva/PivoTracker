import {
  Paper,
  Group,
  Badge,
  Text,
  Accordion,
  SimpleGrid,
  Alert,
} from '@mantine/core';
import dayjs from 'dayjs';
import { CalendarDay } from './WashingTimetable';
import { SlotComponent } from './SlotComponent';
import { AddWashingModal } from './AddWashingModal';

export const DayItem = ({ day }: { day: CalendarDay }) => {
  return (
    <Paper
      p="md"
      radius={0}
      // withBorder
      shadow="md"
      style={{
        minHeight: '50px',
        padding: '4px',
      }}
    >
      <Group align="center">
        <Text
          size="2rem"
          style={{
            fontWeight: day.isToday ? 'bold' : 'normal',
            color: day.isToday ? '#228be6' : 'inherit',
          }}
        >
          {day.date.format('D').padStart(2, '0')}
        </Text>

        <Accordion
          style={{
            flex: 1,
          }}
        >
          <Accordion.Item key={0} value={'a'}>
            <Accordion.Control>
              <Group>
                <SlotComponent day={day} machine={1} color="indigo" />
                <SlotComponent day={day} machine={2} color="orange" />
              </Group>
            </Accordion.Control>

            <Accordion.Panel>
              {day.events.length == 0 && (
                <Alert mt="md" title="prazno">
                  Ni rezerviranih terminov za ta dan
                </Alert>
              )}
              <SimpleGrid cols={2}>
                <Group mt="lg">
                  {day.events
                    .filter((ev) => ev.machine_id == 1)
                    .map((event) => (
                      <Badge
                        variant="light"
                        color={event.machine_id == 1 ? 'indigo' : 'orange'}
                        key={event.reservation_id}
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={`Machine ${event.machine_id}: ${dayjs(
                          event.slot_start,
                        ).format('HH:mm')} - ${dayjs(event.slot_end).format(
                          'HH:mm',
                        )}`}
                      >
                        {event.user_email}
                      </Badge>
                    ))}
                </Group>
                <Group mt="lg">
                  {day.events
                    .filter((ev) => ev.machine_id == 2)
                    .map((event) => (
                      <Badge
                        variant="light"
                        color={event.machine_id == 1 ? 'indigo' : 'orange'}
                        key={event.reservation_id}
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={`Machine ${event.machine_id}: ${dayjs(
                          event.slot_start,
                        ).format('HH:mm')} - ${dayjs(event.slot_end).format(
                          'HH:mm',
                        )}`}
                      >
                        {event.user_email}
                        {`${dayjs(event.slot_start).format('HH:mm')} - ${dayjs(
                          event.slot_end,
                        ).format('HH:mm')}`}
                      </Badge>
                    ))}
                </Group>
              </SimpleGrid>
              <AddWashingModal day={day} />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Group>
    </Paper>
  );
};
