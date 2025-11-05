import {
  Paper,
  Group,
  Text,
  Accordion,
  SimpleGrid,
  Alert,
  Stack,
  ThemeIcon,
  Box,
} from '@mantine/core';
import { CalendarDay } from './WashingTimetable';
import { SlotComponent } from './SlotComponent';
import { AddWashingModal } from './AddWashingModal';
import { FormatLocalDateCustom } from '../../../../utils/timeUtils';
import { ReservationItemInfo } from './ReservationItem';
import dayjs from 'dayjs';
import { IconMoodEmpty } from '@tabler/icons-react';

export const DayItem = ({
  day,
  enabled = true,
}: {
  day: CalendarDay;
  enabled?: boolean;
}) => {
  return (
    <Paper
      withBorder
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
        <Stack align="center" gap="xs">
          <ThemeIcon size="xl" variant={day.isToday ? 'filled' : 'light'}>
            {FormatLocalDateCustom(day.date, 'D')}
          </ThemeIcon>
          <Text size="sm" c="dimmed">
            {FormatLocalDateCustom(day.date, 'ddd')}
          </Text>
        </Stack>

        <Accordion
          style={{
            flex: 1,
          }}
        >
          <Accordion.Item
            key={0}
            value={'a'}
            style={{
              borderBottom: 'none',
            }}
          >
            <Accordion.Control>
              <Group>
                <SlotComponent day={day} machine={1} color="indigo" />
                <SlotComponent day={day} machine={2} color="orange" />
              </Group>
            </Accordion.Control>

            <Accordion.Panel>
              {day.events.length == 0 &&
                (day.date.endOf('day') >= dayjs().utc() ? (
                  <Alert
                    mt="md"
                    title="prazno"
                    color="gray"
                    icon={<IconMoodEmpty></IconMoodEmpty>}
                  >
                    Ni rezarvacij za ta dan. Dodaj svoje z klikom na{' '}
                    <b>"Dodaj termin"</b>
                  </Alert>
                ) : (
                  <Alert
                    mt="md"
                    title="prazno"
                    color="gray"
                    icon={<IconMoodEmpty></IconMoodEmpty>}
                  >
                    Ni rezarvacij za ta dan.
                  </Alert>
                ))}
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
                <div style={{ width: 'fit-content', marginLeft: 'auto' }}>
                  <AddWashingModal day={day.date} enabled={false} />
                </div>
              )}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Group>
    </Paper>
  );
};
