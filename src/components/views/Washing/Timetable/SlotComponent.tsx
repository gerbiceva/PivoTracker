import { MantineColor, Progress } from '@mantine/core';
import { CalendarDay } from './WashingTimetable';
import { useMemo } from 'react';

interface Section {
  isSpacer: boolean;
  present: boolean;
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
  const sections = useMemo<Section[]>(() => {
    // Create an array to represent all 6 sections
    const allSections = Array(8).fill(false);

    // Mark sections as present if they have events
    day.events.forEach((event) => {
      if (
        event.slot_index! >= 1 &&
        event.slot_index! <= 6 &&
        event.machine_id == machine
      ) {
        allSections[event.slot_index! - 1] = true; // Convert to 0-based index
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
      });
    }

    return result;
  }, [day, machine]);
  return (
    <Progress.Root size="lg" style={{ flex: 1 }} mx="lg">
      {sections.map((section) =>
        section.isSpacer ? (
          <Progress.Section value={2} color="grayish"></Progress.Section>
        ) : (
          <Progress.Section
            value={100 / 6}
            color={section.present ? color : 'grayish'}
          ></Progress.Section>
        ),
      )}
    </Progress.Root>
  );
};
