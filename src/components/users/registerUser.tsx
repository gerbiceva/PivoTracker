import {
  Alert,
  Button,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useCallback, useState } from 'react';
import { supabaseClient } from '../../supabase/supabaseClient';
import { notifications } from '@mantine/notifications';

export interface SignupProps {
  email: string;
  name: string;
  surname: string;
  room?: string;
  phone_number?: string;
  date_of_birth?: Date;
  redirectTo?: string;
}

export const UserRegisterForm = () => {
  const [userType, setUserType] = useState('Gerbičevc');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm<SignupProps>({
    mode: 'controlled',
    initialValues: {
      email: '',
      name: '',
      surname: '',
      room: '',
      date_of_birth: new Date(),
      phone_number: '',
    },
    validate: {
      email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : 'Invalid email format';
      },
    },
  });

  const signUp = useCallback(
    async (values: SignupProps) => {
      setLoading(true);
      setError(null);

      try {
        // Call the invite-user edge function using supabase functions.invoke
        const { error } = await supabaseClient.functions.invoke('invite-user', {
          body: {
            ...values,
          } as SignupProps,
        });

        if (error) {
          throw new Error(error.message || 'Failed to send invitation');
        }

        // Show success message to user
        notifications.show({
          title: 'Uporabnik ustvarjen',
          message:
            'Uporabnik je ustvarjen. Na mail je bila poslana avtorizacijska koda',
        });

        // Reset form after successful submission
        form.reset();
      } catch (err: any) {
        console.error('Error inviting user:', err);
        setError(
          err.message || 'An error occurred while sending the invitation',
        );
      } finally {
        setLoading(false);
      }
    },
    [form],
  );

  const handleSubmit = (values: SignupProps) => {
    if (userType === 'Zunanji') {
      const { room, phone_number, date_of_birth, ...rest } = values;
      return signUp({
        ...rest,
        room: undefined,
        phone_number: undefined,
        date_of_birth: undefined,
      });
    }
    return signUp(values);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} autoComplete="off">
      <Stack mx="auto">
        <SegmentedControl
          data={['Zunanji', 'Gerbičevc']}
          size="md"
          value={userType}
          onChange={setUserType}
        />
        {error && (
          <Alert
            title="Error"
            color="red"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        <Group w="100%" wrap="nowrap" align="end">
          <TextInput
            required
            w="100%"
            description="Email"
            placeholder="bruc@brucmail.com"
            key={form.key('email')}
            {...form.getInputProps('email')}
          />
        </Group>
        <Group w="100%" wrap="nowrap" align="end">
          <TextInput
            required
            w="100%"
            description="Ime"
            placeholder="Marsel"
            key={form.key('name')}
            {...form.getInputProps('name')}
          />
          <TextInput
            required
            w="100%"
            description="Priimek"
            placeholder="Levstik"
            key={form.key('surname')}
            {...form.getInputProps('surname')}
          />
        </Group>

        {userType === 'Gerbičevc' && (
          <>
            <SimpleGrid w="100%" cols={2}>
              <TextInput
                w="100%"
                description="Soba"
                placeholder="101"
                key={form.key('room')}
                {...form.getInputProps('room')}
              />
              <TextInput
                w="100%"
                description="Telefonska"
                placeholder="031 130 234"
                key={form.key('phone_number')}
                {...form.getInputProps('phone_number')}
              />
            </SimpleGrid>
            <DatePickerInput
              w="100%"
              description="Datum rojstva"
              placeholder="1. 1. 2000"
              key={form.key('date_of_birth')}
              {...form.getInputProps('date_of_birth')}
            />
          </>
        )}
        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={loading}>
            Submit
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
