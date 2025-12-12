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
          <p>Ustvarite lahko uporabnika, ki živi na gerbičevi, ali ne.</p>
          <p>
            Zunanji uporabniki bodo lahko kupovali pivo ter videli dogodke,
            nimajo pa dostopa do pranja in podobnih funkcij.
          </p>
          <p>
            Po uspešno ustvarjenem računu, se uporabnik z emailom in kodo lahko
            prijavi v sistem.
          </p>
        </Alert>
        <UserRegisterForm />
      </Stack>
    </Container>
  );
};
