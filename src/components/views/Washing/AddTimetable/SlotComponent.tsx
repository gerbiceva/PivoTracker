import {
  alpha,
  Badge,
  darken,
  Group,
  lighten,
  MantineColor,
  Paper,
  parseThemeColor,
  Progress,
  Stack,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarDay, dayType } from './AddWashingTimetable';
import { useMemo } from 'react';
import { addReservation } from './addReservation';

interface Section {
  isSpacer: boolean;
  present: boolean;
  dayEvent?: dayType;
  // slot start, e.g. "09"; slots are fixed 3h blocks from local midnight
  hour?: string;
  start?: Dayjs;
  // empty, upcoming and not blocked, so it can be reserved by clicking
  bookable?: boolean;
}
export const SlotComponent = ({
  day,
  machine,
  color,
}: {
  day: CalendarDay;
  machine: number;
  color: MantineColor;
}) => {
  const theme = useMantineTheme();
  const parsedColor = parseThemeColor({ color, theme });

  const sections = useMemo<Section[]>(() => {
    // Create an array to represent all 6 sections
    const allSections = Array(8).fill(false);
    const dayData: dayType[] = Array(8).fill(false);

    // Mark sections as present if they have events
    day.events.forEach((event) => {
      if (
        event.slot_index_local! >= 1 &&
        event.slot_index_local! <= 8 &&
        event.machine_id == machine
      ) {
        allSections[event.slot_index_local! - 1] = true; // Convert to 0-based index
        dayData[event.slot_index_local! - 1] = event; // Convert to 0-based index
      }
    });

    // Create the sections array with spacers
    const result: Section[] = [];
    const dayStart = day.date.local().startOf('day');
    const now = dayjs();

    for (let i = 0; i < 8; i++) {
      // Add spacer before all sections except the first one
      if (i > 0) {
        result.push({
          present: false,
          isSpacer: true,
        });
      }

      // Add the actual section
      const start = dayStart.hour(i * 3);
      // Wednesday 9-12 on machine 2 is reserved for the cleaner (same rule
      // as AddWashingModal)
      const cleaner = machine == 2 && i == 3 && start.day() == 3;
      result.push({
        present: allSections[i],
        isSpacer: false,
        dayEvent: dayData[i],
        hour: String(i * 3).padStart(2, '0'),
        start,
        bookable:
          !allSections[i] && !cleaner && start.add(3, 'hour').isAfter(now),
      });
    }

    return result;
  }, [day, machine]);

  const confirmReservation = (start: Dayjs) => {
    const end = start.add(3, 'hour');
    modals.openConfirmModal({
      title: (
        <Text fw={700} size="lg">
          Rezerviraj termin?
        </Text>
      ),
      centered: true,
      children: (
        <Paper
          radius="md"
          p="md"
          mb="xs"
          bg={alpha(parsedColor.value, 0.08)}
          style={{ border: `1px solid ${alpha(parsedColor.value, 0.3)}` }}
        >
          <Group wrap="nowrap" gap="md">
            <Paper radius="md" w={56} py={6} ta="center" withBorder>
              <Text size="10px" fw={700} c="dimmed" tt="uppercase">
                {start.format('ddd')}
              </Text>
              <Text fw={700} size="xl" lh={1.1} c={color}>
                {start.format('D')}
              </Text>
            </Paper>
            <Stack gap={2}>
              <Text
                fw={700}
                fz={22}
                lh={1.2}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {start.format('HH:mm')} – {end.format('HH:mm')}
              </Text>
              <Group gap="xs">
                <Text size="sm" c="dimmed" tt="capitalize">
                  {start.format('dddd, D. MMMM')}
                </Text>
                <Badge variant="light" color={color} size="sm">
                  Stroj {machine}
                </Badge>
              </Group>
            </Stack>
          </Group>
        </Paper>
      ),
      labels: { confirm: 'Rezerviraj', cancel: 'Prekliči' },
      confirmProps: { color },
      onConfirm: () => addReservation(start, end, machine),
    });
  };

  return (
    <Progress.Root size="1.5rem" style={{ flex: 1 }} mx="xs">
      {sections.map((section, i) =>
        section.isSpacer ? (
          <Progress.Section
            key={'sp' + i}
            value={2}
            style={{ opacity: 0 }}
          ></Progress.Section>
        ) : (
          <Progress.Section
            key={'sect' + i}
            value={100 / 8} // 24h , 3hour long section -> 8
            onClick={
              section.bookable
                ? (e: React.MouseEvent) => {
                    // the bar sits in the accordion header; don't toggle it
                    e.stopPropagation();
                    confirmReservation(section.start!);
                  }
                : undefined
            }
            style={section.bookable ? { cursor: 'pointer' } : undefined}
            color={
              section.present
                ? alpha(darken(parsedColor.value, 0.0), 0.95)
                : alpha(parsedColor.value, 0.05)
            }
          >
            <Progress.Label
              visibleFrom="md"
              c={
                section.present
                  ? lighten(parsedColor.value, 0.8)
                  : alpha(parsedColor.value, 0.45)
              }
            >
              {`${section.hour}h`}
            </Progress.Label>

            <Progress.Label
              hiddenFrom="md"
              c={
                section.present
                  ? lighten(parsedColor.value, 0.8)
                  : alpha(parsedColor.value, 0.45)
              }
              style={{
                fontSize: '70%',
                marginTop: '1px',
              }}
            >
              {section.hour}
            </Progress.Label>
          </Progress.Section>
        ),
      )}
    </Progress.Root>
  );
};
