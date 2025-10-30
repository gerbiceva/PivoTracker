import {
  Alert,
  Avatar,
  Box,
  Button,
  Center,
  Container,
  Group,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCircleKey } from '@tabler/icons-react';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { useUser } from '../../../supabase/loader';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthError } from '@supabase/supabase-js';

export function Authentication() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<AuthError>();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  if (user) {
    return <Navigate to="/"></Navigate>;
  }

  return (
    <Box h="100vh" w="100vw">
      <img
        src="/GerbaLogo.svg"
        alt=""
        style={{
          position: 'absolute',
          zIndex: -100,
          opacity: 0.04,
          maxHeight: '100vh',
        }}
      />
      <Center h="100vh" w="100%">
        <Container size={820} miw={540}>
          <Stack align="center" w="100%">
            <Group align="center">
              <Avatar variant="outline" size="md">
                G59
              </Avatar>
              <Title>Gerba unified interface</Title>
            </Group>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md" miw={350}>
              <form
                onSubmit={form.onSubmit(async (values) => {
                  setLoading(true);
                  setErr(undefined);
                  await supabaseClient.auth
                    .signInWithPassword({
                      email: values.email,
                      password: values.password,
                    })
                    .then((res) => {
                      if (res.error) {
                        setErr(res.error);
                      }
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                })}
              >
                <TextInput
                  label="Email"
                  placeholder="bruc@brucmail.dev"
                  required
                  {...form.getInputProps('email')}
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  required
                  mt="md"
                  {...form.getInputProps('password')}
                />

                {err && (
                  <Alert mt="lg" color="red" title="Napaka">
                    {err.message}
                  </Alert>
                )}
                <Button fullWidth mt="xl" type="submit" loading={loading}>
                  Sign in
                </Button>
              </form>
            </Paper>
            <Alert
              mt="xl"
              variant="outline"
              icon={<IconCircleKey> </IconCircleKey>}
              maw="350px"
            >
              Uporabniški račun ustvari pri pristojnem vladniku.
            </Alert>
          </Stack>
        </Container>
      </Center>
    </Box>
  );
}
