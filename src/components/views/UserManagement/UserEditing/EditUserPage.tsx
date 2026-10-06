import { Container, Title, Stack, Alert } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { EditUserBaseInfo } from './EditUserBaseInfo';
import { EditUserEmail } from './EditUserEmail';
import { ResidentInfoForm } from './ResidentInfoForm';
import { EditUserPermissions } from './EditUserPermissions';
import { $currUser } from '../../../../global-state/user';
import { useStore } from '@nanostores/react';
import { IconLock } from '@tabler/icons-react';

// Edit forms for one user; used by the standalone page and the table's drawer.
export const EditUserForms = ({ userId }: { userId: number }) => {
  const user = useStore($currUser);
  return (
    <Stack gap="md">
      <EditUserBaseInfo userId={userId} />
      <EditUserEmail userId={userId} />
      <ResidentInfoForm baseUserId={userId} />
      {user?.permissions.includes('MANAGE_PERMISSIONS') ? (
        <EditUserPermissions userId={userId} />
      ) : (
        <Alert title="Ni dovoljenja" icon={<IconLock />}>
          <p>Nimate dovoljenja za urejanje pravic uporabnikov</p>
        </Alert>
      )}
    </Stack>
  );
};

export const EditUserPage = () => {
  const { id } = useParams();
  const userId = parseInt(id || '');
  return (
    <Container>
      <Stack gap="md" my="xl">
        <Title>Edit User {userId}</Title>
        <EditUserForms userId={userId} />
      </Stack>
    </Container>
  );
};
