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
import {
  FormatLocalDateCustom,
  ReadTimeFromUTCString,
} from '../../../../utils/timeUtils';

export const DayItem = ({ day }: { day: CalendarDay }) => {
  return (
    <Paper
      p="md"
      radius={0}
      shadow="md"
      style={{
        minHeight: '50px',
        padding: '4px',
      }}
    >
      {/* {day.date.toISOString()} {FormatLocalDateCustom(day.date, 'MM.DD HH:mm')} */}
      <Group align="center">
        <Text
          size="2rem"
          style={{
            fontWeight: day.isToday ? 'bold' : 'normal',
            color: day.isToday ? '#228be6' : 'inherit',
          }}
        >
          {/* {day.date.format('D')} */}
          {FormatLocalDateCustom(day.date, 'D')}
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
                          event.slot_start_utc,
                        ).format('HH:mm')} - ${dayjs(event.slot_end_utc).format(
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
                          event.slot_start_utc,
                        ).format('HH:mm')} - ${dayjs(event.slot_end_utc).format(
                          'HH:mm',
                        )}`}
                      >
                        {event.user_email}
                        {`${FormatLocalDateCustom(
                          ReadTimeFromUTCString(event.slot_start_utc!),
                          'HH:mm',
                        )} - ${FormatLocalDateCustom(
                          ReadTimeFromUTCString(event.slot_end_utc!),
                          'HH:mm',
                        )}`}
                      </Badge>
                    ))}
                </Group>
              </SimpleGrid>
              <AddWashingModal day={day.date} />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Group>
    </Paper>
  );
};
