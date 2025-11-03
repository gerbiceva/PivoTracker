import {
  Stack,
  Paper,
  Title,
  LoadingOverlay,
  Alert,
  MultiSelect,
  Button,
} from '@mantine/core';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { IconAlertCircle } from '@tabler/icons-react';
import { useMemo, useState } from 'react';

export const EditUserPermissions = ({ userId }: { userId: number }) => {
  const {
    data: userPermissions,
    error: userPermissionsError,
    isLoading: areUserPermissionsLoading,
    mutate: mutateUserPermissions,
  } = getSupaWR({
    query: () =>
      supabaseClient
        .from('user_permissions_view')
        .select('*')
        .eq('user_id', userId),
    table: 'user_permissions_view',
    params: [userId],
  });

  const {
    data: allPermissions,
    error: allPermissionsError,
    isLoading: areAllPermissionsLoading,
  } = getSupaWR({
    query: () => supabaseClient.from('permission_types').select('*'),
    table: 'permission_types',
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const permissionOptions = useMemo(() => {
    return (
      allPermissions?.map((p) => ({
        value: p.id.toString(),
        label: p.display_name || '',
      })) || []
    );
  }, [allPermissions]);

  useState(() => {
    if (userPermissions) {
      setSelectedPermissions(
        userPermissions.map((p) => p.permission_type_id?.toString() || ''),
      );
    }
  });

  const handleSavePermissions = async () => {
    if (!userId) return;

    // Delete all existing permissions for the user
    await supabaseClient.from('permissions').delete().eq('user_id', userId);

    // Add the new permissions
    const newPermissions = selectedPermissions.map((id) => ({
      user_id: userId,
      permission_type: Number(id),
    }));
    await supabaseClient.from('permissions').insert(newPermissions);

    mutateUserPermissions();
  };

  const error = userPermissionsError || allPermissionsError;
  const isLoading = areUserPermissionsLoading || areAllPermissionsLoading;

  if (error) {
    return (
      <Alert title="Error loading permissions" icon={<IconAlertCircle />}>
        {error.message}
      </Alert>
    );
  }

  return (
    <Paper withBorder p="md" style={{ position: 'relative' }}>
      <LoadingOverlay visible={isLoading} />
      <Stack>
        <Title order={3}>Permissions</Title>
        <MultiSelect
          data={permissionOptions}
          value={selectedPermissions}
          onChange={setSelectedPermissions}
          label="User Permissions"
          placeholder="Select permissions"
        />
        <Button onClick={handleSavePermissions}>Save Permissions</Button>
      </Stack>
    </Paper>
  );
};
