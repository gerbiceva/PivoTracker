import {
  Text,
  Stack,
  Title,
  Container,
  TextInput,
  SimpleGrid,
  Fieldset,
  Box,
  Tooltip,
  useMatches,
  Alert,
  Group,
  Button,
} from '@mantine/core';
import { ReadTimeFromUTCString } from '../../../utils/timeUtils';
import { getZodiacSign, zodiacToIcon } from '../../../utils/zodiac';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { $currUser } from '../../../global-state/user';
import { User } from '@supabase/supabase-js';
import { PreinitializedWritableAtom } from 'nanostores';

import { useStore } from '@nanostores/react';
import { DateInput } from '@mantine/dates';
import { LogoutBtn } from '../auth/Logout';
import { IconLogout } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { DisplayPermissions } from '../../permissons/DisplayPermissions';

export const EditSelf = () => {
  const cols = useMatches({
    base: 1,
    sm: 2,
  });

  const zodiac = getZodiacSign(ReadTimeFromUTCString(new Date().toUTCString()));

  const user = useStore($currUser);

  const { data } = getSupaWR({
    query: () =>
      supabaseClient
        .from('user_view')
        .select('*')
        .filter('auth_user_id', 'eq', user?.id)
        .single(),
    table: 'base_users',
    params: [user?.id],
  });

  return (
    <Container>
      <Stack py="lg">
        <Stack gap="xs" pos="relative">
          <Title>Uporabnik</Title>
          <Text c="dimmed">Pregled informacij o sebi.</Text>
          <Text c="dimmed">
            Tukaj lahko pogledate svoje nastavitve in če niso pravilne
            obvestitesvojega ministra.
          </Text>

          {/* <Box pos="absolute" style={{ right: 0 }}>
            <Tooltip
              color="gray"
              label={getZodiacSign(
                ReadTimeFromUTCString(new Date().toUTCString()),
              )}
            >
              {zodiac && (
                <Box opacity={0.1}>{zodiacToIcon(zodiac, '10rem')}</Box>
              )}
            </Tooltip>
          </Box> */}
        </Stack>

        <Alert w="fit-content" ml="auto" my="xl" color="gray">
          <Group justify="start" align="start" ml="auto">
            <Stack gap="0">
              <Text c="dimmed">Zadnji login</Text>
              <Text fw="bold">
                {dayjs(user?.last_sign_in_at).format('DD.MM YYYY')}
              </Text>
            </Stack>
            <LogoutBtn variant="subtle">
              <IconLogout />
            </LogoutBtn>
          </Group>
        </Alert>

        <Title order={3} my="lg" mb="sm">
          Osebne informacije
        </Title>

        <DisplayPermissions userID={data?.base_user_id || 0} />

        <Fieldset legend="Osebne informacije">
          <SimpleGrid cols={cols}>
            <TextInput
              readOnly
              label="Ime"
              value={data?.name || ''}
              variant="filled"
            />
            <TextInput
              readOnly
              label="Priimek"
              value={data?.surname || ''}
              variant="filled"
            />
            <TextInput
              readOnly
              value={data?.auth_email || ''}
              label="Email"
              variant="filled"
            />
          </SimpleGrid>
        </Fieldset>

        {data?.resident_id ? (
          <Fieldset legend="Podatki stanovalca">
            <SimpleGrid cols={cols}>
              <TextInput
                readOnly
                label="Soba"
                value={data?.room || ''}
                variant="filled"
              />
              <DateInput
                readOnly
                label="Datum rojstva"
                value={new Date(data?.room || '')}
                variant="filled"
              />
              <TextInput
                readOnly
                label="Telefonska številka"
                value={data?.phone_number || ''}
                variant="filled"
              />
            </SimpleGrid>
          </Fieldset>
        ) : (
          <Alert title="Uporabnik ni stanovalec">
            Uporabnik ni stanovalec, za to podatki o bivanju in sobi niso
            prikazani.
          </Alert>
        )}

        <Title order={3} my="lg" mb="sm">
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
