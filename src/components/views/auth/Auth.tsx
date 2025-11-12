import {
  Button,
  Paper,
  Text,
  TextInput,
  Title,
  Box,
  SimpleGrid,
  Alert,
  Stack,
  LoadingOverlay,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { useUser } from '../../../supabase/loader';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthError } from '@supabase/supabase-js';
import { notifications } from '@mantine/notifications';
import { IconSparkles } from '@tabler/icons-react';

export function Authentication() {
  const { user, loading: loadginUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<AuthError>();
  const [otpSent, setOtpSent] = useState(false); // New state to track if OTP is sent

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

  if (loadginUser) {
    return <LoadingOverlay visible></LoadingOverlay>;
  }
  if (user) {
    return <Navigate to="/"></Navigate>;
  }

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0} h="100vh">
      <Paper
        p={30}
        shadow="xl"
        radius={0}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box style={{ maxWidth: 450, width: '100%' }}>
          <Stack>
            <Title order={2} ta="center">
              Dobrodošli na G59.si!
            </Title>
            <Text ta="center" mb={50} c="dimmed">
              Najbolši website pod ljubljanskim soncem.
            </Text>
          </Stack>

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
                  },
                })
                .then((res) => {
                  if (res.error) {
                    setErr(res.error);
                  } else {
                    setOtpSent(true); // Set OTP sent to true
                    notifications.show({
                      title: 'link za prijavo poslan',
                      message:
                        'Čarobni link je bil poslan na vaš e-poštni naslov. Preverite svoj nabiralnik za prijavo.',
                    });
                  }
                })
                .finally(() => {
                  setLoading(false);
                });
            })}
          >
            <TextInput
              label="Email"
              placeholder="gerbicevc@gmail.com"
              size="md"
              radius="md"
              required
              autoComplete="email"
              {...form.getInputProps('email')}
            />

            {!otpSent && (
              <Button
                fullWidth
                mt="xl"
                size="md"
                radius="md"
                type="submit"
                loading={loading}
                leftSection={<IconSparkles opacity={0.7} />}
              >
                Pošlji čarobni link
              </Button>
            )}

            {otpSent && (
              <>
                <Text ta="center" mt="md" color="dimmed">
                  Čarobni link je bil poslan na vaš e-poštni naslov. Preverite
                  svoj nabiralnik za prijavo.
                </Text>
                <TextInput
                  label="OTP koda"
                  placeholder="Vnesite 6-mestno kodo"
                  mt="md"
                  maxLength={6}
                  {...form.getInputProps('otp')}
                />
                <Button
                  fullWidth
                  mt="md"
                  size="md"
                  radius="md"
                  onClick={async () => {
                    if (!form.values.otp) {
                      setErr({
                        message: 'Prosimo, vnesite OTP kodo za preverjanje',
                        status: 400,
                      } as AuthError);
                      return;
                    }

                    setLoading(true);
                    setErr(undefined);

                    // Verify OTP
                    await supabaseClient.auth
                      .verifyOtp({
                        email: form.values.email,
                        token: form.values.otp,
                        type: 'email',
                      })
                      .then((res) => {
                        if (res.error) {
                          setErr(res.error);
                        } else {
                          notifications.show({
                            title: 'Prijavljen',
                            message: 'Uspešno ste prijavljeni v sistem.',
                          });
                          // window.location.href = '/';
                        }
                      })
                      .finally(() => {
                        setLoading(false);
                      });
                  }}
                  loading={loading}
                  disabled={form.values.otp.length == 0}
                >
                  Preveri OTP
                </Button>
              </>
            )}

            {err && (
              <Alert color="red" ta="center" mt="md">
                {err.message}
              </Alert>
            )}
          </form>
        </Box>
      </Paper>

      <Box
        visibleFrom="md"
        style={{
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        <Box
          style={{
            backgroundImage:
              'url(https://www.sdl.si/fileadmin/user_upload/Slike/Domovi/Dom_G59/G59-DSC_6338-Vic-Gerb1.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(1) brightness(1.3)',
            position: 'absolute',
            height: '100%',
            width: '100%',
            zIndex: 0,
          }}
        />
        <Box
          style={{
            backgroundImage: 'url(/gerba_cutout.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'absolute',
            height: '100%',
            width: '100%',
            filter: 'contrast(1.2)',
            zIndex: 10,
          }}
        />
      </Box>
    </SimpleGrid>
  );
}
