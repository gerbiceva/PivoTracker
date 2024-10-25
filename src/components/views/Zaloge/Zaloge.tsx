import { Alert, LoadingOverlay, Stack, Title, Button } from '@mantine/core';
import { useGetZaloge } from './UseGetZaloge';
import { IconExclamationCircle } from '@tabler/icons-react';
import { ZalogeTable } from './ZalogeTable';

export const Zaloge = () => {
  const { data, error, isLoading } = useGetZaloge();

  return (
    <Stack pos="relative" py="xl">
      <LoadingOverlay visible={isLoading} />
      <Title order={2}>Zaloge</Title>
      <Alert
        color="gray"
        title="Pazi"
        icon={<IconExclamationCircle></IconExclamationCircle>}
      >
        Zaloge so namenjene sledenju stanja piva pri <b>Tekočih ministrih</b>.
        <br />
        Za upravljanje z kupovanjem piva za Gerbičevo, pojdite na{' '}
        <Button px="0" variant="subtle">
          Nabava
        </Button>
      </Alert>
      {/* <ZalogeAdder /> */}
      {error && (
        <Alert color="red" title="Error pri zalogah">
          {error.message}
        </Alert>
      )}
      {data && <ZalogeTable data={data} error={error} isLoading={isLoading} />}
    </Stack>
  );
};
