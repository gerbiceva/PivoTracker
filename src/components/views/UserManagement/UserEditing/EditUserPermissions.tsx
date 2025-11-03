import {
  Stack,
  Text,
  LoadingOverlay,
  Alert,
  MultiSelect,
  Button,
  Box,
  Badge,
  Group,
  type MultiSelectProps,
} from '@mantine/core';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { IconAlertCircle } from '@tabler/icons-react';
import { useMemo, useState, useEffect } from 'react';
import { numToColor } from '../../../../utils/colorUtils';

const renderPermissionOption: MultiSelectProps['renderOption'] = ({
  option,
}) => (
  <Group>
    <Badge variant="light" color={numToColor(Number(option.value))}>
      {option.label}
    </Badge>
  </Group>
);

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
    query: () =>
      supabaseClient.from('permission_types').select('*').order('id'),
    table: 'permission_types',
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [initialPermissions, setInitialPermissions] = useState<string[]>([]);

  const permissionsChanged = useMemo(() => {
    const sortedInitial = [...initialPermissions].sort();
    const sortedSelected = [...selectedPermissions].sort();
    return JSON.stringify(sortedInitial) !== JSON.stringify(sortedSelected);
  }, [initialPermissions, selectedPermissions]);

  const permissionOptions = useMemo(() => {
    return (
      allPermissions?.map((p) => ({
        value: p.id.toString(),
        label: p.display_name || '',
      })) || []
    );
  }, [allPermissions]);

  console.log({ allPermissions });

  useEffect(() => {
    if (userPermissions) {
      const initial =
        userPermissions.map((p) => p.permission_type_id?.toString() || '') ||
        [];
      setSelectedPermissions(initial);
      setInitialPermissions(initial);
    }
  }, [userPermissions]);

  const handleSavePermissions = async () => {
    if (!userId) return;

    // Add the new permissions
    const newPermissions = selectedPermissions
      .map((id) => Number(id))
      .sort((a, b) => a - b);

    // Delete all existing permissions for the user
    await supabaseClient.rpc('set_user_permissions', {
      p_base_user_id: userId,
      p_permission_type_ids: newPermissions,
    });

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
    <Box>
      <LoadingOverlay visible={isLoading} />
      <Stack>
        <Text size="xs" fw="bold" c="dimmed" mt="xl">
          UREJANJE PRAVIC
        </Text>
        <MultiSelect
          comboboxProps={{
            position: 'top',
          }}
          data={permissionOptions}
          value={selectedPermissions}
          onChange={setSelectedPermissions}
          description="User Permissions"
          placeholder="Select permissions"
          renderOption={renderPermissionOption}
          hidePickedOptions
          searchable
        />
        <div>
          <Button
            size="xs"
            variant="light"
            disabled={!permissionsChanged}
            onClick={handleSavePermissions}
          >
            Save Permissions
          </Button>
        </div>
      </Stack>
    </Box>
  );
};
