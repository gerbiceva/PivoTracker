import { Alert, Text, SimpleGrid, Stack, Skeleton } from '@mantine/core';
import { Tables } from '../../../../supabase/supabase';
import { useGetItems } from './useItems';
import { useEffect } from 'react';
import { formatCurrency } from '../../../../utils/Converter';

interface Props {
  value: Tables<'items'> | undefined;
  onChange: (value: Tables<'items'> | undefined) => void;
  label?: string;
}

export const ItemSelect = ({ onChange, value, label }: Props) => {
  const { data, isLoading, error } = useGetItems();

  useEffect(() => {
    if (data != undefined) {
      onChange(data[0]);
    }
    // dont put onChange as a dependancy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (error) {
    return (
      <Alert color="red" title="item error">
        Napaka pri pridobivanju artiklov
      </Alert>
    );
  }

  return (
    <Stack pos="relative" gap="xs">
      {label && <Text>{label}</Text>}
      <SimpleGrid cols={{ lg: 3, md: 2, sm: 1 }}>
        {isLoading &&
          [1, 2, 3].map((i) => <Skeleton key={i} visible={true} h="6rem" />)}
        {data?.map((item) => (
          // <Card key={item.id}>
          <Alert
            style={{
              cursor: 'pointer',
            }}
            onClick={() => {
              onChange(item);
            }}
            key={item.id}
            title={item.name}
            variant={value?.id == item.id ? 'filled' : 'light'}
          >
            {formatCurrency(item.price)}
          </Alert>
          // </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
};
