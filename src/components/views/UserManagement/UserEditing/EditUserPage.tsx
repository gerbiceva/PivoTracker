import { Container, Title, Stack, Alert } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { EditUserBaseInfo } from './EditUserBaseInfo';
import { ResidentInfoForm } from './ResidentInfoForm';
import { EditUserPermissions } from './EditUserPermissions';
import { $currUser } from '../../../../global-state/user';
import { useStore } from '@nanostores/react';
import { IconLock } from '@tabler/icons-react';

export const EditUserPage = () => {
  const { id } = useParams();
  const userId = parseInt(id || '');
  const user = useStore($currUser);
  return (
    <Container>
      <Stack gap="md" my="xl">
        <Title>Edit User {userId}</Title>
        <EditUserBaseInfo userId={userId} />
        <ResidentInfoForm baseUserId={userId} />
        {user?.permissions.includes('MANAGE_PERMISSIONS') ? (
          <EditUserPermissions userId={userId} />
        ) : (
          <Alert title="Ni dovoljenja" icon={<IconLock />}>
            <p>Nimate dovoljenja za urejanje pravic uporabnikov</p>
          </Alert>
        )}
      </Stack>
    </Container>
  );
};
