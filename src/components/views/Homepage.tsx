import { Alert, Stack, Title } from '@mantine/core';

export const HomePage = () => {
  return (
    <Stack>
      <Title>G59.si</Title>
      <Title order={4}>Gerba website</Title>

      <Alert>
        Website je še v delu. Tle ni še nič, pridejo pa lepe reči hmal.😘
      </Alert>
    </Stack>
  );
};
