import {
  Badge,
  Divider,
  Group,
  Modal,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import { useStore } from '@nanostores/react';
import { $currUser } from '../../../global-state/user';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { Database } from '../../../supabase/supabase';
import {
  Field,
  formatDate,
  Section,
  UserDetailsHeader,
} from './UserEditing/UserDetails';
import { capitalizeName } from './UserEditing/useUserEditing';

type PermissionGroup = Database['public']['Tables']['permission_groups']['Row'];
type PermissionType = Database['public']['Tables']['permission_types']['Row'];

const FIELD_GRID = { gridTemplateColumns: '120px 1fr' };

// Read-only view of the logged-in user's own data; changes go through admins.
export const MyProfileModal = ({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) => {
  const me = useStore($currUser);
  const userId = me?.base_user_id ?? 0;

  // the vloga isn't part of get_user_full_details
  const { data: own } = getSupaWR({
    query: () =>
      supabaseClient
        .from('base_users')
        .select('permgroup_id')
        .eq('id', userId)
        .single(),
    table: 'base_users',
    params: ['own-group', userId],
  });
  const { data: groups } = getSupaWR({
    query: () => supabaseClient.from('permission_groups').select('*'),
    table: 'permission_groups',
  });
  const { data: types } = getSupaWR({
    query: () =>
      supabaseClient.from('permission_types').select('*').order('id'),
    table: 'permission_types',
  });

  // effective permissions (vloga + extras); readable names where we have them
  const displayName = new Map(
    ((types as PermissionType[] | undefined) ?? []).map((t) => [
      t.name,
      t.display_name || t.name,
    ]),
  );
  const permissions = (me?.permissions ?? []).map((name) => ({
    name,
    label: displayName.get(name) ?? name,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title={
        me ? (
          <UserDetailsHeader
            user={{ ...me, permgroup_id: own?.permgroup_id ?? null }}
            groups={(groups as PermissionGroup[] | undefined) ?? []}
          />
        ) : (
          <Skeleton h={56} w={240} />
        )
      }
    >
      {me && (
        <Stack gap={0}>
          <Section title="Osebni podatki">
            <SimpleGrid
              cols={2}
              spacing="xs"
              verticalSpacing={6}
              style={FIELD_GRID}
            >
              <Field
                label="Ime in priimek"
                value={
                  capitalizeName(
                    `${me.name ?? ''} ${me.surname ?? ''}`.trim(),
                  ) || null
                }
              />
              <Field label="E-pošta" value={me.auth_email} />
            </SimpleGrid>
          </Section>
          <Divider />

          <Section title="Bivanje">
            {me.resident_id ? (
              <SimpleGrid
                cols={2}
                spacing="xs"
                verticalSpacing={6}
                style={FIELD_GRID}
              >
                <Field label="Soba" value={me.room} />
                <Field label="Telefon" value={me.phone_number || null} />
                <Field
                  label="Rojstni datum"
                  value={formatDate(me.birth_date)}
                />
              </SimpleGrid>
            ) : (
              <Text size="sm" c="dimmed">
                Nisi vpisan kot stanovalec.
              </Text>
            )}
          </Section>
          <Divider />

          <Section title="Dovoljenja">
            {permissions.length > 0 ? (
              <Group gap={6}>
                {permissions.map((p) => (
                  <Badge key={p.name} variant="light">
                    {p.label}
                  </Badge>
                ))}
              </Group>
            ) : (
              <Text size="sm" c="dimmed">
                Nimaš posebnih dovoljenj.
              </Text>
            )}
          </Section>
          <Divider />

          <Text size="xs" c="dimmed" pt="md">
            Če kaj ni prav, se obrni na nekoga iz uprave.
          </Text>
        </Stack>
      )}
    </Modal>
  );
};
