import { Alert, Button, Group, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCallback, useState } from 'react';
import { supabaseClient } from '../../supabase/supabaseClient';
import { User } from '@supabase/supabase-js';

export interface SignupProps {
  email: string;
  name: string;
 surname: string;
 room?: string;
}

interface UserRegisterPromptProps {
  onSubmit: (values: User) => void;
}

export const UserRegisterForm = ({ onSubmit }: UserRegisterPromptProps) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm<SignupProps>({
    mode: 'controlled',
    initialValues: {
      email: '',
      name: '',
      surname: '',
      room: '',
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
            email: values.email,
            name: values.name,
            surname: values.surname,
            room: values.room,
            redirectTo: `${window.location.origin}/auth`, // Redirect to auth page after accepting invitation
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to send invitation');
        }

        // Show success message to user
        alert('Invitation sent successfully! The user will receive an email with instructions.');
        
        // Reset form after successful submission
        form.reset();
      } catch (err: any) {
        console.error('Error inviting user:', err);
        setError(err.message || 'An error occurred while sending the invitation');
      } finally {
        setLoading(false);
      }
    },
    [onSubmit, form],
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
        <Group w="100%" wrap="nowrap" align="end">
          <TextInput
            w="100%"
            label="Soba (optional)"
            placeholder="Soba 101"
            key={form.key('room')}
            {...form.getInputProps('room')}
          />
        </Group>
        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={loading}>Submit</Button>
        </Group>
      </Stack>
    </form>
  );
};
