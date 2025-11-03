import {
  Alert,
  Badge,
  Group,
  Text,
  GroupProps,
  LoadingOverlay,
  Stack,
  Modal,
} from '@mantine/core';
import { usePermissionsForUser } from './useGetPermissions';
import { IconAlertCircle } from '@tabler/icons-react';
import { numToColor } from '../../utils/colorUtils';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { Database } from '../../supabase/supabase';

export interface DisplayPermissionsProps extends GroupProps {
  userID: number;
}

export type Permission =
  Database['public']['Views']['user_permissions_view']['Row'];

export const DisplayPermissions = ({ userID }: DisplayPermissionsProps) => {
  const { data, error, isLoading } = usePermissionsForUser(userID);
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);

  const handleBadgeClick = (permission: Permission) => {
    setSelectedPermission(permission);
    open();
  };

  if (error) {
    return (
      <Alert
        title="Napaka pri nalaganju pravic"
        icon={<IconAlertCircle></IconAlertCircle>}
      >
        {error.message}
      </Alert>
    );
  }

  return (
    <>
      <Modal opened={opened} onClose={close} title="Podrobnosti dovoljenja">
        {selectedPermission && (
          <Stack>
            <Text>
              <Text span fw="bold">
                Ime:
              </Text>{' '}
              {selectedPermission.permission_display_name}
            </Text>
            <Text>
              <Text span fw="bold">
                Dodano:
              </Text>{' '}
              {dayjs(selectedPermission.created_at).format(
                'DD. MM. YYYY HH:mm',
              )}
            </Text>
            <Text>
              <Text span fw="bold">
                Dodal:
              </Text>{' '}
              <Link to={`/user/${selectedPermission.permission_creator}`}>
                Uporabnik {selectedPermission.permission_creator}
              </Link>
            </Text>
          </Stack>
        )}
      </Modal>

      <Stack>
        <Text size="xs" fw="bold" c="dimmed">
          DOVOLJENJA
        </Text>
        <Group pos="relative">
          {data &&
            data.map((permission) => (
              <Badge
                onClick={() => handleBadgeClick(permission)}
                variant="light"
                key={permission.permission_id}
                color={numToColor(permission.permission_id || 0)}
                style={{ cursor: 'pointer' }}
              >
                {permission.permission_name}
              </Badge>
            ))}

          {data?.length == 0 && (
            <Badge variant="dot" color="red">
              Brez dovoljenj
            </Badge>
          )}
          <LoadingOverlay visible={isLoading} />
        </Group>
      </Stack>
    </>
  );
};
