import {
  TextInput,
  Button,
  Text,
  LoadingOverlay,
  Alert,
  Box,
  Stack,
  Group,
  Modal,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { useEffect, useState } from 'react';
import { IconAlertCircle, IconMail } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { refetchTables } from '../../../../supabase/supa-utils/supaSWRCache';

export const EditUserEmail = ({ userId }: { userId: number; }) => {
  const {
    data: user,
    error,
    isLoading,
  } = getSupaWR({
    query: () =>
      supabaseClient
        .from('user_view')
        .select('*')
        .filter('base_user_id', 'eq', userId)
        .single(),
    table: 'user_view',
    params: [userId],
  });

  const form = useForm({
    initialValues: {
      email: '',
      confirmEmail: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      confirmEmail: (value, values) =>
        value === values.email ? null : 'Emails do not match',
    },
  });

  const [changeEmailModalOpen, setChangeEmailModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      form.setInitialValues({
        email: user.auth_email || '',
        confirmEmail: '',
      });
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, form.reset, form.setInitialValues]);

  const handleChangeEmail = async (values: typeof form.values) => {
    if (!user?.auth_user_id) {
      showNotification({
        title: 'Napaka',
        message: 'Uporabniški račun ni bil najden. Osvežite stran in poskusite znova.',
        color: 'red',
      });
      return;
    }

    if (values.email === user.auth_email) {
      showNotification({
        title: 'Brez sprememb',
        message: 'Nov email naslov je enak trenutnemu.',
        color: 'blue',
      });
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const { error: updateError } = await supabaseClient.functions.invoke('update-email', {
        body: { auth_user_id: user.auth_user_id, email: values.email },
      });

      clearTimeout(timeoutId);

      if (updateError) {
        const errorMessage = updateError.message?.toLowerCase() || '';

        if (errorMessage.includes('already') || errorMessage.includes('exists')) {
          throw new Error('Ta email naslov je že v uporabi.');
        } else if (errorMessage.includes('invalid') || errorMessage.includes('format')) {
          throw new Error('Neveljaven format email naslova.');
        } else if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
          throw new Error('Preveč zahtev. Prosimo, počakajte pred ponovnim poskusom.');
        }

        throw updateError;
      }

      showNotification({
        title: 'Potrditev poslana',
        message:
          'Email za potrditev je uspešno poslan. Prosim preveri email za verifikacijo.',
        color: 'green',
      });

      refetchTables("user_view");

      form.reset();
      setChangeEmailModalOpen(false);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        showNotification({
          title: 'Časovna omejitev',
          message: 'Zahteva je potekla. Prosimo, poskusite znova.',
          color: 'red',
        });
        return;
      }

      showNotification({
        title: 'Napaka',
        message: error instanceof Error ? error.message : 'Prišlo je do napake pri spreminjanju email naslova.',
        color: 'red',
      });
    }
  };

  // const handleRequestEmailChange = () => {
  //   if (form.values.email !== user?.auth_email) {
  //     setChangeEmailModalOpen(true);
  //   } else {
  //     showNotification({
  //       title: 'No Changes',
  //       message: 'Email is the same as current email',
  //       color: 'blue',
  //     });
  //   }
  // };

  if (error) {
    return (
      <Alert title="Error loading user" icon={<IconAlertCircle />}>
        {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <LoadingOverlay visible={isLoading} />
      <Stack>
        <Text size="xs" fw="bold" c="dimmed" mt="xl">
          EMAIL NASLOV
        </Text>

        <Group align="end">
          <TextInput
            description="Email"
            value={user?.auth_email || ''}
            disabled
            w="100%"
            leftSection={<IconMail size={16} />}
          />
          <Button
            size="xs"
            variant="light"
            onClick={() => setChangeEmailModalOpen(true)}
          >
            Spremeni email
          </Button>
        </Group>

        <Modal
          opened={changeEmailModalOpen}
          onClose={() => {
            setChangeEmailModalOpen(false);
            form.reset();
          }}
          title="Change Email"
          size="sm"
        >
          <form onSubmit={form.onSubmit(handleChangeEmail)}>
            <Stack>
              <TextInput
                label="New Email"
                placeholder="nov@email.com"
                required
                {...form.getInputProps('email')}
              />
              <TextInput
                label="Confirm New Email"
                placeholder="Re-enter the new email address"
                description="Please confirm the new email address for security"
                required
                {...form.getInputProps('confirmEmail')}
              />

              <Group justify="flex-end" mt="md">
                <Button
                  variant="outline"
                  onClick={() => {
                    setChangeEmailModalOpen(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="blue"
                  disabled={
                    !form.isValid() ||
                    form.values.email !== form.values.confirmEmail ||
                    form.values.email === user?.auth_email
                  }
                >
                  Change Email
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </Box>
  );
};
