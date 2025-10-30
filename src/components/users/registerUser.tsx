import { Alert, Button, Group, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCallback, useState } from 'react';
import { supabaseClient } from '../../supabase/supabaseClient';
import { User } from '@supabase/supabase-js';

export interface SignupProps {
  email: string;
  name: string;
  surname: string;
}

interface UserRegisterPromptProps {
  onSubmit: (values: User) => void;
}

export const UserRegisterForm = ({ onSubmit }: UserRegisterPromptProps) => {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SignupProps>({
    mode: 'controlled',
    initialValues: {
      email: '',
      name: '',
      surname: '',
    },
    validate: {},
  });

  const signUp = useCallback(
    (values: SignupProps) => {
      supabaseClient.auth
        .signInWithOtp({
          email: values.email,
          options: {
            data: {
              name: values.name,
              surname: values.surname,
            },
          },
        })
        .then((response) => {
          if (response.error) {
            setError(response.error.message);
          } else if (response.data.user) {
            onSubmit(response.data.user);
          }
        });
    },
    [onSubmit],
  );

  return (
    <form onSubmit={form.onSubmit(signUp)} autoComplete="off">
      <Stack mx="auto">
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
            label="Email"
            placeholder="bruc@brucmail.com"
            key={form.key('email')}
            {...form.getInputProps('email')}
          />
        </Group>
        <Group w="100%" wrap="nowrap" align="end">
          <TextInput
            required
            w="100%"
            label="Ime"
            placeholder="Marsel"
            key={form.key('name')}
            {...form.getInputProps('name')}
          />
          <TextInput
            required
            w="100%"
            label="Priimek"
            placeholder="Levstik"
            key={form.key('surname')}
            {...form.getInputProps('surname')}
          />
        </Group>
        <Group justify="flex-end" mt="md">
          <Button type="submit">Submit</Button>
        </Group>
      </Stack>
    </form>
  );
};
