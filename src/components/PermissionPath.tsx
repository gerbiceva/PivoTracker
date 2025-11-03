import { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { $currUser } from '../global-state/user';

interface PermissionPathProps extends PropsWithChildren {
  permission: string;
}

export const PermissionPath = ({
  children,
  permission,
}: PermissionPathProps) => {
  const permissions = $currUser.get()?.permissions || [];

  if (!permissions.includes(permission)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};
