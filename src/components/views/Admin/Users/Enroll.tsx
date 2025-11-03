import { Alert, Container, Stack } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { UserRegisterForm } from '../../../users/registerUser';

export const EnrollUser = () => {
  return (
    <Container>
      <Stack my="xl" p="md">
        <Alert
          title="Opozorilo"
          variant="light"
          color="gray"
          my="md"
          icon={<IconAlertCircle></IconAlertCircle>}
        >
          <p>
            Ustvarite novega uporabnika z <b> emialom in geslom.</b>
          </p>
          <p>
            Geslo naj je enostavno da se uporabnik lahko prijavi, ter nujno
            spremeni geslo ob prvem vpisu.
          </p>
        </Alert>
        <UserRegisterForm />
      </Stack>
    </Container>
  );
};
