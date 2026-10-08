import {
  alpha,
  darken,
  lighten,
  MantineColor,
  parseThemeColor,
  Progress,
  useMantineTheme,
} from '@mantine/core';
import { CalendarDay, dayType } from './AddWashingTimetable';
import { useMemo } from 'react';

interface Section {
  isSpacer: boolean;
  present: boolean;
  dayEvent?: dayType;
  // slot start, e.g. "09"; slots are fixed 3h blocks from midnight
  hour?: string;
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

    for (let i = 0; i < 8; i++) {
      // Add spacer before all sections except the first one
      if (i > 0) {
        result.push({
          present: false,
          isSpacer: true,
        });
      }

      // Add the actual section
      result.push({
        present: allSections[i],
        isSpacer: false,
        dayEvent: dayData[i],
        hour: String(i * 3).padStart(2, '0'),
      });
    }

    return result;
  }, [day, machine]);

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
