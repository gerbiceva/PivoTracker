import {
  Alert,
  Avatar,
  Box,
  Button,
  Center,
  Container,
  Group,
  Paper,
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
      otp: '',
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      otp: (value) =>
        value && value.length > 0
          ? value.length === 6
            ? null
            : 'OTP must be 6 digits'
          : null,
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
              <Stack>
                <form
                  onSubmit={form.onSubmit(async (values) => {
                    setLoading(true);
                    setErr(undefined);

                    // Send OTP
                    await supabaseClient.auth
                      .signInWithOtp({
                        email: values.email,
                        options: {
                          shouldCreateUser: false,
                          emailRedirectTo: window.location.origin,
                        },
                      })
                      .then((res) => {
                        if (res.error) {
                          setErr(res.error);
                        } else {
                          // Show success message to user to check their email
                          alert('Please check your email for the OTP code');
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

                  {err && (
                    <Alert mt="lg" color="red" title="Napaka">
                      {err.message}
                    </Alert>
                  )}
                  <Button fullWidth mt="xl" type="submit" loading={loading}>
                    Send OTP
                  </Button>
                </form>

                <form
                  onSubmit={form.onSubmit(async (values) => {
                    if (!values.otp) {
                      setErr({
                        message: 'Please enter an OTP code to verify',
                        status: 400,
                      } as AuthError);
                      return;
                    }

                    setLoading(true);
                    setErr(undefined);

                    // Verify OTP
                    await supabaseClient.auth
                      .verifyOtp({
                        email: values.email,
                        token: values.otp,
                        type: 'email',
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
                    label="OTP Code"
                    placeholder="Enter 6-digit code (optional)"
                    mt="md"
                    maxLength={6}
                    {...form.getInputProps('otp')}
                  />
                  <Button fullWidth mt="md" type="submit" loading={loading}>
                    Verify OTP
                  </Button>
                </form>
              </Stack>
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
