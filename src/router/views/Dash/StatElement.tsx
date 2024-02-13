import { Paper, Group, Text } from "@mantine/core";
import classes from "./StatsGrid.module.css";
import { IconArrowsDiff } from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";

interface Stat {
  title: string;
  value: number | string;
  diff: number;
  Icon: Icon;
}

export const StatElement = (stat: Stat) => {
  return (
    <Paper withBorder p="md" radius="md" key={stat.title}>
      <Group justify="space-between" wrap="nowrap">
        <Text size="xs" c="dimmed" className={classes.title}>
          {stat.title}
        </Text>
        <stat.Icon className={classes.icon} size="1.4rem" stroke={1.5} />
      </Group>

      <Group align="flex-end" gap="xs" mt={25}>
        <Text size="1.7rem" fw="bold">
          {stat.value}
        </Text>
        {/* <Text
          c={stat.diff > 0 ? "teal" : "red"}
          fz="sm"
          fw={500}
          className={classes.diff}
        >
          <span>{stat.diff}%</span>
          <IconArrowsDiff size="1rem" stroke={1.5} />
        </Text> */}
      </Group>

      {/* <Text fz="xs" c="dimmed" mt={7}>
        Compared to previous month
      </Text> */}
    </Paper>
  );
};
