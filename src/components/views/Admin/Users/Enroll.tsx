import { Alert, Button, Stack, Stepper, Paper, Text } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRegisterForm } from '../../../users/registerUser';
import { IconAlertCircle } from '@tabler/icons-react';
import { User } from '@supabase/supabase-js';
import { EnrollUserDetails } from './EnrollUserDetails';
import { LinkCustomer } from './LinkCustomer';
import { UserEditFormValues } from '../../../users/UserEditForm';

interface Customer {
  id: number;
  fullname: string;
  user_link: string | null;
}

export const EnrollUser = () => {
  const [active, setActive] = useState(0);
  const [newUser, setNewUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserEditFormValues | null>(
    null,
  );
  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(null);
  const navigate = useNavigate();

  const nextStep = () =>
    setActive((current) => (current < 3 ? current + 1 : current));

  // const prevStep = () =>
  //   setActive((current) => (current > 0 ? current - 1 : current));

  const handleRegisterSubmit = (user: User) => {
    setNewUser(user);
    nextStep();
  };

  return (
    <Stack my="xl">
      <Stepper active={active} my="xl">
        <Stepper.Step label="Registracija" description="Nov vporaniški račun">
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
        </Stepper.Step>

        <Stepper.Step label="Vnos" description="Vnos novega uporabnika">
          {newUser && (
            <EnrollUserDetails
              newUser={newUser}
              onSubmit={(values: UserEditFormValues) => {
                setUserDetails(values);
                nextStep();
              }}
            />
          )}
        </Stepper.Step>

        <Stepper.Step label="Povezave" description="Poveži z kupci piva">
          {newUser && userDetails && (
            <LinkCustomer
              newUser={newUser}
              userDetails={userDetails}
              onSubmit={(customer) => {
                if (customer) {
                  setLinkedCustomer(customer);
                }
                nextStep();
              }}
            />
          )}
        </Stepper.Step>

        <Stepper.Step label="Final step" description="Get full access">
          {newUser && userDetails && (
            <Paper p="md" withBorder my="xl">
              <Text>
                <b>Email:</b> {newUser.email}
              </Text>
              <Text>
                <b>ID:</b> {newUser.id}
              </Text>
              <Text>
                <b>Ime:</b> {userDetails.ime}
              </Text>
              <Text>
                <b>Priimek:</b> {userDetails.priimek}
              </Text>
              <Text>
                <b>Soba:</b> {userDetails.stevilkaSobe}
              </Text>
              <Text>
                <b>Telefonska:</b> {userDetails.telefonska}
              </Text>
              <Text>
                <b>Datum rojstva:</b>{' '}
                {userDetails.datumRojstva.toLocaleDateString()}
              </Text>
              {linkedCustomer && (
                <>
                  <Text>
                    <b>Povezan kupec:</b> {linkedCustomer.fullname}
                  </Text>
                  <Text>
                    <b>ID Kupca:</b> {linkedCustomer.id}
                  </Text>
                </>
              )}
            </Paper>
          )}
        </Stepper.Step>

        <Stepper.Completed>
          <Button
            size="xl"
            my="xl"
            onClick={() => {
              navigate('/admin/enroll');
            }}
          >
            Končaj
          </Button>
        </Stepper.Completed>
      </Stepper>
    </Stack>
  );
};
