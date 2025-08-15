import {
  Paper,
  Group,
  Text,
  Accordion,
  SimpleGrid,
  Alert,
} from '@mantine/core';
import { CalendarDay } from './WashingTimetable';
import { SlotComponent } from './SlotComponent';
import { AddWashingModal } from './AddWashingModal';
import { FormatLocalDateCustom } from '../../../../utils/timeUtils';
import { ReservationItemInfo } from './ReservationItem';
import dayjs from 'dayjs';

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
                      <div>
                        <ReservationItemInfo reservation={event} />
                      </div>
                    ))}
                </Group>
                <Group mt="lg">
                  {day.events
                    .filter((ev) => ev.machine_id == 2)
                    .map((event) => (
                      <div>
                        <ReservationItemInfo reservation={event} />
                      </div>
                    ))}
                </Group>
              </SimpleGrid>
              {day.date.endOf('day') >= dayjs().utc() && (
                <AddWashingModal day={day.date} />
              )}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Group>
    </Paper>
  );
};
