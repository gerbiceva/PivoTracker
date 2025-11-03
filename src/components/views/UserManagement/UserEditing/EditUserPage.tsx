import { Container, Title, Stack } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { EditUserBaseInfo } from './EditUserBaseInfo';
import { EditUserResidentInfo } from './EditUserResidentInfo';
import { EditUserPermissions } from './EditUserPermissions';

export const EditUserPage = () => {
  const { id } = useParams();
  const userId = parseInt(id || '');
  return (
    <Container>
      <Stack>
        <Title>Edit User {userId}</Title>
        <EditUserBaseInfo userId={userId} />
        {/* <EditUserResidentInfo userId={userId} /> */}
        {/* <EditUserPermissions userId={userId} /> */}
      </Stack>
    </Container>
  );
};
