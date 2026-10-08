import { Group, Stack, Text, Title } from '@mantine/core';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  // main action, shown on the right
  action?: ReactNode;
}

// Shared header so every admin page starts the same way. On narrow screens
// the action wraps below the title.
export const PageHeader = ({ title, description, action }: PageHeaderProps) => (
  <Group justify="space-between" align="flex-start" mb="xs">
    <Stack gap={4} style={{ flex: '1 1 16rem' }}>
      <Title order={2}>{title}</Title>
      {description && <Text c="dimmed">{description}</Text>}
    </Stack>
    {action}
  </Group>
);
