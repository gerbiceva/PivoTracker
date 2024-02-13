import { Text, Paper, Group, RingProgress, Center, rem } from "@mantine/core";
import type { Icon } from "@tabler/icons-react";

interface RingStat {
  label: string;
  stats: string;
  sections: { value: number; color: string }[];
  Icon: Icon;
}

export const StatsRing = ({ sections, label, stats, Icon }: RingStat) => {
  return (
    <Paper withBorder radius="md" p="xs" key={label}>
      <Group>
        <RingProgress
          size={100}
          roundCaps
          thickness={8}
          sections={sections}
          label={
            <Center>
              <Icon style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
            </Center>
          }
        />

        <div>
          <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
            {label}
          </Text>
          <Text fw={700} size="xl">
            {stats}
          </Text>
        </div>
      </Group>
    </Paper>
  );
};
