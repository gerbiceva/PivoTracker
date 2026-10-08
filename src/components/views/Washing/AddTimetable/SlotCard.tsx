import {
  alpha,
  Badge,
  Group,
  MantineColor,
  Paper,
  parseThemeColor,
  Stack,
  Text,
  useMantineTheme,
} from '@mantine/core';
import { Dayjs } from 'dayjs';

interface SlotCardProps {
  start: Dayjs;
  end: Dayjs;
  machineLabel: string;
  color: MantineColor;
}

// A washing slot shown as a card tinted in the machine's color.
export const SlotCard = ({
  start,
  end,
  machineLabel,
  color,
}: SlotCardProps) => {
  const theme = useMantineTheme();
  const parsedColor = parseThemeColor({ color, theme });

  return (
    <Paper
      radius="md"
      p="md"
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
              {machineLabel}
            </Badge>
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
};
