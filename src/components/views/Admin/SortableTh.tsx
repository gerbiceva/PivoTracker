import { Center, Group, Table, Text, UnstyledButton } from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconSelector,
} from '@tabler/icons-react';
import { ReactNode } from 'react';

export interface SortState<F extends string> {
  field: F;
  reversed: boolean;
}

interface SortableThProps<F extends string> {
  w?: number;
  field: F;
  sort: SortState<F>;
  onSort: (field: F) => void;
  children: ReactNode;
}

// Table header cell that toggles sorting by its field.
export const SortableTh = <F extends string>({
  w,
  field,
  sort,
  onSort,
  children,
}: SortableThProps<F>) => {
  const active = sort.field === field;
  const Icon = active
    ? sort.reversed
      ? IconChevronUp
      : IconChevronDown
    : IconSelector;
  return (
    <Table.Th w={w}>
      <UnstyledButton onClick={() => onSort(field)}>
        <Group gap={4} wrap="nowrap">
          <Text fw="bold" size="sm">
            {children}
          </Text>
          <Center>
            <Icon size={14} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
};
