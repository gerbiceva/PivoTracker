import { Stack, Title, Button, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import { PermissionPath } from '../PermissionPath';
import { useStore } from '@nanostores/react';
import { $currUser } from '../../global-state/user';

export const HomePage = () => {
  const user = useStore($currUser);

  return (
    <Stack align="center" justify="center" style={{ minHeight: '80vh' }}>
      <Title order={1}>Welcome to G59.si</Title>
      <Title order={4}>
        Your personal PivoTracker and Washing Machine Manager
      </Title>

      {/* <Alert
        title="Under Construction"
        color="blue"
        variant="filled"
        style={{ maxWidth: 400, textAlign: 'center' }}
      >
        This website is still under development. More exciting features are
        coming soon!
      </Alert> */}

      <Group mt="xl">
        {user && (
          <>
            <Button
              component={Link}
              to="/user"
              variant="gradient"
              gradient={{ from: 'indigo', to: 'cyan' }}
            >
              My Profile
            </Button>
            <PermissionPath permission="CAN_WASH">
              <Button
                component={Link}
                to="/pranje/novo"
                variant="gradient"
                gradient={{ from: 'teal', to: 'lime', deg: 105 }}
              >
                Washing Machine
              </Button>
            </PermissionPath>
            <Button
              component={Link}
              to="/promises/view"
              variant="gradient"
              gradient={{ from: 'red', to: 'orange' }}
            >
              Top Obljube Users
            </Button>
          </>
        )}
      </Group>
    </Stack>
  );
};
