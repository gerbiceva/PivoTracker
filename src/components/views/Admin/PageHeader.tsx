import { Group, Stack, Text, Title } from '@mantine/core';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  // main action, shown on the right
  action?: ReactNode;
}

// Shared header so every admin page starts the same way.
export const PageHeader = ({ title, description, action }: PageHeaderProps) => (
  <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
    <Stack gap={4}>
      <Title order={2}>{title}</Title>
      {description && <Text c="dimmed">{description}</Text>}
    </Stack>
    {action}
  </Group>
);
