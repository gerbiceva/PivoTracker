import { Alert, Button, Group, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCallback, useState } from 'react';
import { supabaseClient } from '../../supabase/supabaseClient';
import { User } from '@supabase/supabase-js';

export interface SignupProps {
  email: string;
  password: string;
}

interface UserRegisterPromptProps {
  onSubmit: (values: User) => void;
}

export const UserRegisterForm = ({ onSubmit }: UserRegisterPromptProps) => {
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    mode: 'controlled',
    initialValues: {
      email: '',
      password: '',
    },
    validate: {},
  });

  const signUp = useCallback(
    (values: SignupProps) => {
      supabaseClient.auth
        .signUp({
          email: values.email,
          password: values.password,
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
      <Stack maw="70ch" mx="auto">
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
          <TextInput
            required
            w="100%"
            label="Password"
            description="Začasno geslo"
            placeholder="tezkogeslo123"
            key={form.key('password')}
            {...form.getInputProps('password')}
          />
        </Group>
        <Group justify="flex-end" mt="md">
          <Button type="submit">Submit</Button>
        </Group>
      </Stack>
    </form>
  );
};
