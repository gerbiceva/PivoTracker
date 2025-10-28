import {
  Text,
  Stack,
  Title,
  Container,
  useMatches,
  Alert,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Badge,
  Group,
  Avatar,
  ActionIcon,
} from '@mantine/core';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { IconAlertCircle, IconLink } from '@tabler/icons-react';
import { numToColor, stringToColor } from '../../../utils/colorUtils';
import { serialize } from 'swr/_internal';
import dayjs from 'dayjs';

export const EditUsers = () => {
  const cols = useMatches({
    base: 1,
    md: 3,
  });

  const { data, error, isLoading } = getSupaWR({
    query: () => supabaseClient.from('base_users').select('*'),
    table: 'base_users',
  });

  return (
    <Container pos="relative">
      <LoadingOverlay visible={isLoading} />
      <Stack>
        <Stack gap="xs" pos="relative">
          <Title>Pregled userjev</Title>
          <Text c="dimmed">Pregled informacij o sebi.</Text>
          <Text c="dimmed">
            Tukaj lahko pogledate svoje nastavitve in če niso pravilne
            obvestitesvojega ministra.
          </Text>
        </Stack>
      </Stack>

      {error && (
        <Alert title="Napaka" icon={<IconAlertCircle></IconAlertCircle>}>
          {error.message}
        </Alert>
      )}

      <SimpleGrid cols={cols} mt="xl">
        {data?.map((user) => (
          <Paper withBorder p="sm">
            <Stack>
              <Group justify="space-between" w="100%" wrap="nowrap">
                <Group w="100%">
                  <Avatar color={numToColor(user.id)} size="md">
                    {user.id}
                  </Avatar>
                  <Text>
                    {user.name} {user.surname}
                  </Text>
                </Group>

                <ActionIcon variant="subtle" size="sm">
                  <IconLink />
                </ActionIcon>
              </Group>

              <Group>
                <Text c="dimmed" size="sm">
                  {dayjs(user.created_at).format('DD.MM YYYY')}
                </Text>
              </Group>

              {user.resident ? (
                <Group>
                  <Text>{user.resident}</Text>
                </Group>
              ) : (
                <Badge>Ni stanovalec</Badge>
              )}
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>
    </Container>
  );
};
