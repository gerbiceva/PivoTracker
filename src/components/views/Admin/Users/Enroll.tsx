import { Button, Container, Stack } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { UserRegisterForm } from '../../../users/registerUser';
import { PageHeader } from '../PageHeader';

export const EnrollUser = () => {
  const navigate = useNavigate();
  return (
    <Container size="sm">
      <Stack my="xl" gap="lg">
        <PageHeader
          title="Nov uporabnik"
          description="Uporabnik se po ustvarjenem računu prijavi z emailom in kodo, ki jo prejme po pošti."
          action={
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate(-1)}
            >
              Nazaj
            </Button>
          }
        />
        <UserRegisterForm />
      </Stack>
    </Container>
  );
};
