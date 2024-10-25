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
import { supabaseClient } from '../../supabase/supabaseClient';
import { useUser } from '../../supabase/loader';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';

export function Authentication() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

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
      <Center h="100vh" w="100%">
        <Container size={820} miw={540}>
          <Stack align="center" w="100%">
            <Group align="center">
              <Avatar variant="outline" size="md">
                G59
              </Avatar>
              <Title>Tekoče ministrstvo</Title>
            </Group>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md" miw={350}>
              <form
                onSubmit={form.onSubmit(async (values) => {
                  setLoading(true);
                  await supabaseClient.auth
                    .signInWithPassword({
                      email: values.email,
                      password: values.password,
                    })
                    .then(() => {
                      setLoading(false);
                    });
                })}
              >
                <TextInput
                  label="Email"
                  placeholder="you@mantine.dev"
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
              Uporabniške račune ustvarite v 3. (najboljšem) štuku, pri
              pristojnemu ministru.
            </Alert>
          </Stack>
        </Container>
      </Center>
    </Box>
  );
}
