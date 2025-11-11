import { PropsWithChildren } from 'react';
import { $currUser } from '../global-state/user';
import { Unauthorized } from './views/Unauthorized';
import { useStore } from '@nanostores/react';
import { LoadingOverlay } from '@mantine/core';

interface PermissionPathProps extends PropsWithChildren {
  permission: string;
}

export const PermissionPath = ({
  children,
  permission,
}: PermissionPathProps) => {
  const user = useStore($currUser);

  if (!user) {
    return <LoadingOverlay visible></LoadingOverlay>;
  }

  if (!user.permissions.includes(permission)) {
    return <Unauthorized />;
  }

  return children;
};
