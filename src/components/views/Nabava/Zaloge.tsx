import { Alert, LoadingOverlay, Stack, Title, Button } from '@mantine/core';
import { NabavaAdder } from './NabavaAdder';
import { NabavaTable } from './NabavaTable';
import { useGetNabava } from './UseGetNabava';
import { IconExclamationCircle } from '@tabler/icons-react';

export const Zaloge = () => {
  const { data, error, isLoading } = useGetNabava();

  return (
    <Stack pos="relative" py="xl">
      <Title order={2}>Zaloge</Title>
      <Alert
        color="gray"
        title="Pazi"
        icon={<IconExclamationCircle></IconExclamationCircle>}
      >
        Zaloge so namenjene sledenju nabave piva, ki jih <b>Gerbičeva kupi.</b>
        <br />
        Za sledenje lokalnim zalogam tekočih ministrov pojdi na{' '}
        <Button px="0" variant="subtle">
          transakcije ministrov
        </Button>
      </Alert>
      <LoadingOverlay visible={false} />
      <NabavaAdder />
      {error && (
        <Alert color="red" title="Error displaying nabava">
          {error.message}
        </Alert>
      )}
      {data && (
        <NabavaTable
          data={data}
          error={error}
          isLoading={isLoading}
        ></NabavaTable>
      )}
    </Stack>
  );
};
