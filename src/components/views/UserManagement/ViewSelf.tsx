import {
  Alert,
  Button,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  useMatches,
} from '@mantine/core';
import { $currUser } from '../../../global-state/user';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';

import { DateInput } from '@mantine/dates';
import { useStore } from '@nanostores/react';
import { IconHomeCancel, IconLogout } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { DisplayPermissions } from '../../permissons/DisplayPermissions';
import { LogoutBtn } from '../auth/Logout';
import { EditUserEmail } from './UserEditing/EditUserEmail';

export const EditSelf = () => {
  const cols = useMatches({
    base: 1,
    sm: 2,
  });

  // const zodiac = getZodiacSign(ReadTimeFromUTCString(new Date().toUTCString()));

  const user = useStore($currUser);

  const { data } = getSupaWR({
    query: () =>
      supabaseClient
        .from('user_view')
        .select('*')
        .filter('auth_user_id', 'eq', user?.auth_user_id)
        .single(),
    table: 'base_users',
    params: [user?.auth_user_id],
  });

  return (
    <Container>
      <Stack py="lg">
        <Group w="100%" justify="space-between">
          <Stack gap="xs" pos="relative">
            <Title>Uporabnik</Title>
            <Text c="dimmed">Pregled informacij o sebi.</Text>
            <Text c="dimmed">
              Tukaj lahko pogledate svoje nastavitve.Če niso pravilne obvestite
              svojega ministra.
            </Text>
          </Stack>

          <Alert w="fit-content" my="xl" color="gray">
            <Group justify="start" align="start" ml="auto">
              <Stack gap="0">
                <Text c="dimmed">Registriran</Text>
                <Text fw="bold">
                  {dayjs(user?.created_at).format('DD.MM YYYY')}
                </Text>
              </Stack>
              <LogoutBtn variant="subtle">
                <IconLogout />
              </LogoutBtn>
            </Group>
          </Alert>
        </Group>

        <Title order={2} my="lg" mb="sm">
          Osebne informacije
        </Title>

        <DisplayPermissions userID={data?.base_user_id || 0} />

        <Text size="xs" fw="bold" c="dimmed" mt="xl">
          OSEBNE INFORMACIJE
        </Text>
        <SimpleGrid cols={cols}>
          <TextInput
            readOnly
            description="Ime"
            value={data?.name || ''}
            variant="filled"
          />
          <TextInput
            readOnly
            description="Priimek"
            value={data?.surname || ''}
            variant="filled"
          />
        </SimpleGrid>

        <EditUserEmail userId={data?.base_user_id || 0} />

        <Text size="xs" fw="bold" c="dimmed" mt="xl">
          PODATKI O STANOVALCU
        </Text>
        {data?.resident_id ? (
          <SimpleGrid cols={cols}>
            <TextInput
              readOnly
              description="Soba"
              value={data?.room || ''}
              variant="filled"
            />
            <DateInput
              readOnly
              description="Datum rojstva"
              value={new Date(data?.room || '')}
              variant="filled"
            />
            <TextInput
              readOnly
              description="Telefonska številka"
              value={data?.phone_number || ''}
              variant="filled"
            />
          </SimpleGrid>
        ) : (
          <Alert
            title="Uporabnik ne stanuje v Gerbičevi"
            color="gray"
            icon={<IconHomeCancel />}
          >
            Uporabnik ni stanovalec, za to podatki o bivanju in sobi niso
            prikazani.
          </Alert>
        )}

        <Title order={2} my="lg" mb="sm">
          Podatki o pranju
        </Title>

        <Text c="dimmed">
          Podatki o pranju so na voljo na strani za pregled terminov
        </Text>
        <div>
          <Button
            px="0"
            variant="subtle"
            component={Link}
            to="/pranje/moje"
            fullWidth={false}
          >
            Pregled pranja
          </Button>
        </div>
      </Stack>
    </Container>
  );
};
