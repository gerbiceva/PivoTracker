import {
  Alert,
  Button,
  Divider,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { supabaseClient } from '../../supabase/supabaseClient';
import { notifications } from '@mantine/notifications';
import {
  IconAt,
  IconCalendar,
  IconCheck,
  IconDoor,
  IconHome,
  IconPhone,
  IconUserPlus,
  IconWorld,
} from '@tabler/icons-react';

export interface SignupProps {
  email: string;
  name: string;
  surname: string;
  room: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  redirectTo?: string;
}

type UserType = 'resident' | 'external';

interface FormValues {
  email: string;
  name: string;
  surname: string;
  room: string;
  phone_number: string;
  date_of_birth: Date | null;
}

const optional = (label: string) => (
  <>
    {label}{' '}
    <Text span size="xs" c="dimmed" fw={400}>
      (neobvezno)
    </Text>
  </>
);

const SectionLabel = ({ children }: { children: string }) => (
  <Text size="xs" fw={700} c="dimmed" tt="uppercase">
    {children}
  </Text>
);

const userTypeHints: Record<UserType, string> = {
  resident: 'Prebivalec Gerbičeve ima dostop do pranja in ostalih funkcij doma.',
  external:
    'Zunanji uporabnik lahko kupuje pivo in vidi dogodke, nima pa dostopa do pranja.',
};

export const UserRegisterForm = () => {
  const [userType, setUserType] = useState<UserType>('resident');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCreated, setLastCreated] = useState<string | null>(null);

  const form = useForm<FormValues>({
    mode: 'controlled',
    initialValues: {
      email: '',
      name: '',
      surname: '',
      room: '',
      phone_number: '',
      date_of_birth: null,
    },
    validate: {
      email: (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
          ? null
          : 'Neveljaven email',
      name: (value) => (value.trim() ? null : 'Ime je obvezno'),
      surname: (value) => (value.trim() ? null : 'Priimek je obvezen'),
      room: (value) => {
        if (userType !== 'resident') return null;
        if (!value.trim()) return 'Soba je obvezna';
        return /^\d+$/.test(value.trim()) ? null : 'Soba mora biti številka';
      },
    },
  });

  const signUp = async (body: SignupProps) => {
    setLoading(true);
    setError(null);
    setLastCreated(null);

    const { error } = await supabaseClient.functions.invoke('invite-user', {
      body,
    });

    if (error) {
      // the function returns { error, details } in the body on non-2xx
      let message = error.message || 'Napaka pri ustvarjanju uporabnika';
      try {
        const payload = await error.context?.json();
        message = payload?.details || payload?.error || message;
      } catch {
        // body wasn't JSON, keep the generic message
      }
      console.error('Error inviting user:', error);
      setError(message);
    } else {
      notifications.show({
        title: 'Uporabnik ustvarjen',
        message: `${body.email} se lahko zdaj prijavi s kodo, poslano na email.`,
        color: 'teal',
      });
      setLastCreated(body.email);
      form.reset();
    }
    setLoading(false);
  };

  const handleSubmit = (values: FormValues) => {
    const isResident = userType === 'resident';
    const phone = values.phone_number.trim();
    return signUp({
      email: values.email.trim(),
      name: values.name.trim(),
      surname: values.surname.trim(),
      room: isResident ? values.room.trim() : null,
      phone_number: isResident && phone ? phone : null,
      date_of_birth:
        isResident && values.date_of_birth
          ? new Date(values.date_of_birth).toISOString()
          : null,
    });
  };

  return (
    <Paper withBorder radius="md" p={{ base: 'md', sm: 'xl' }}>
      <form onSubmit={form.onSubmit(handleSubmit)} autoComplete="off">
        <Stack gap="lg">
          <Stack gap={6}>
            <SegmentedControl
              fullWidth
              size="md"
              value={userType}
              onChange={(v) => {
                setUserType(v as UserType);
                form.clearFieldError('room');
              }}
              data={[
                {
                  value: 'resident',
                  label: (
                    <Group gap={6} justify="center" wrap="nowrap">
                      <IconHome size={16} />
                      <span>Gerbičevc</span>
                    </Group>
                  ),
                },
                {
                  value: 'external',
                  label: (
                    <Group gap={6} justify="center" wrap="nowrap">
                      <IconWorld size={16} />
                      <span>Zunanji</span>
                    </Group>
                  ),
                },
              ]}
            />
            <Text size="sm" c="dimmed">
              {userTypeHints[userType]}
            </Text>
          </Stack>

          {error && (
            <Alert
              title="Napaka"
              color="red"
              withCloseButton
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          {lastCreated && (
            <Alert
              color="teal"
              icon={<IconCheck />}
              withCloseButton
              onClose={() => setLastCreated(null)}
            >
              Uporabnik <b>{lastCreated}</b> je ustvarjen. Prijavi se lahko z
              emailom in kodo, ki jo prejme po pošti.
            </Alert>
          )}

          <Stack gap="sm">
            <SectionLabel>Osnovni podatki</SectionLabel>
            <TextInput
              withAsterisk
              label="Email"
              placeholder="bruc@brucmail.com"
              leftSection={<IconAt size={16} />}
              key={form.key('email')}
              {...form.getInputProps('email')}
            />
            <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
              <TextInput
                withAsterisk
                label="Ime"
                placeholder="Marsel"
                key={form.key('name')}
                {...form.getInputProps('name')}
              />
              <TextInput
                withAsterisk
                label="Priimek"
                placeholder="Levstik"
                key={form.key('surname')}
                {...form.getInputProps('surname')}
              />
            </SimpleGrid>
          </Stack>

          {userType === 'resident' && (
            <>
              <Divider />
              <Stack gap="sm">
                <SectionLabel>Podatki prebivalca</SectionLabel>
                <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
                  <TextInput
                    withAsterisk
                    label="Soba"
                    placeholder="101"
                    inputMode="numeric"
                    leftSection={<IconDoor size={16} />}
                    key={form.key('room')}
                    {...form.getInputProps('room')}
                  />
                  <TextInput
                    label={optional('Telefonska')}
                    placeholder="031 130 234"
                    type="tel"
                    leftSection={<IconPhone size={16} />}
                    key={form.key('phone_number')}
                    {...form.getInputProps('phone_number')}
                  />
                </SimpleGrid>
                <DateInput
                  label={optional('Datum rojstva')}
                  placeholder="Izberi datum"
                  valueFormat="D. M. YYYY"
                  clearable
                  leftSection={<IconCalendar size={16} />}
                  key={form.key('date_of_birth')}
                  {...form.getInputProps('date_of_birth')}
                />
              </Stack>
            </>
          )}

          <Group justify="flex-end">
            <Button
              type="submit"
              loading={loading}
              leftSection={<IconUserPlus size={16} />}
            >
              Ustvari uporabnika
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
};
