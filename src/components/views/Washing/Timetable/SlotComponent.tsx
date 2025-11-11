import {
  alpha,
  darken,
  lighten,
  MantineColor,
  parseThemeColor,
  Progress,
  useMantineTheme,
} from '@mantine/core';
import { CalendarDay, dayType } from './WashingTimetable';
import { useMemo } from 'react';

import {
  FormatLocalDateCustom,
  ReadTimeFromUTCString,
} from '../../../../utils/timeUtils';

interface Section {
  isSpacer: boolean;
  present: boolean;
  dayEvent?: dayType;
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
      });
    }

    return result;
  }, [day, machine]);

  return (
    <Progress.Root size="1.5rem" style={{ flex: 1 }} mx="lg">
      {sections.map((section) =>
        section.isSpacer ? (
          <Progress.Section value={2} style={{ opacity: 0 }}></Progress.Section>
        ) : (
          <Progress.Section
            value={100 / 8} // 24h , 3hour long section -> 8
            color={
              section.present
                ? alpha(darken(parsedColor.value, 0.0), 0.95)
                : alpha(parsedColor.value, 0.05)
            }
          >
            <Progress.Label c={lighten(parsedColor.value, 0.8)}>
              {section.present &&
                section.dayEvent &&
                `${FormatLocalDateCustom(
                  ReadTimeFromUTCString(section.dayEvent.slot_start_utc!),
                  'HH',
                )}h`}
            </Progress.Label>
          </Progress.Section>
        ),
      )}
    </Progress.Root>
  );
};
