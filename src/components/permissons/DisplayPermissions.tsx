import { Alert, Badge, Group, GroupProps, LoadingOverlay } from '@mantine/core';
import { usePermissionsForUser } from './useGetPermissions';
import { IconAlertCircle } from '@tabler/icons-react';

export interface DisplayPermissionsProps extends GroupProps {
  userID: number;
}

export const DisplayPermissions = ({ userID }: DisplayPermissionsProps) => {
  const { data, error, isLoading } = usePermissionsForUser(userID);

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
    <Group pos="relative">
      {data &&
        data.map((permission) => <Badge>{permission.permission_type}</Badge>)}
      <LoadingOverlay visible={isLoading} />
    </Group>
  );
};
