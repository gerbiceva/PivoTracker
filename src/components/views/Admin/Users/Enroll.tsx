import {
  Alert,
  Button,
  Stack,
  Stepper,
  Paper,
  Text,
  Container,
} from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRegisterForm } from '../../../users/registerUser';
import { IconAlertCircle } from '@tabler/icons-react';
import { User } from '@supabase/supabase-js';
import { EnrollUserDetails } from './EnrollUserDetails';
import { UserEditFormValues } from '../../../users/UserEditForm';

export const EnrollUser = () => {
  const [active, setActive] = useState(0);
  const [newUser, setNewUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserEditFormValues | null>(
    null,
  );
  const navigate = useNavigate();

  const nextStep = () =>
    setActive((current) => (current < 3 ? current + 1 : current));

  const handleRegisterSubmit = (user: User) => {
    setNewUser(user);
    nextStep();
  };

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
        <UserRegisterForm onSubmit={handleRegisterSubmit} />
      </Stack>
    </Container>
  );
};
