import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Kbd,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { spotlight } from '@mantine/spotlight';
import { useMediaQuery } from '@mantine/hooks';
import { useUser } from '../../../supabase/loader';
import { useNavigate } from 'react-router-dom';
import { IconLogout } from '@tabler/icons-react';

export const Navbar = () => {
  const matches = useMediaQuery('(min-width: 56.25em)');
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <>
      {/* login indicator */}
      <Tooltip
        label={
          <Stack>
            <Text>{user?.role}</Text>
            <Text>{user?.id}</Text>
          </Stack>
        }
      >
        <Badge
          size="sm"
          pos="fixed"
          bottom={0}
          left={0}
          m="xs"
          variant="dot"
          style={{
            zIndex: 1,
          }}
        >
          {user?.email || 'Neprijavljen'}
        </Badge>
      </Tooltip>
      {/* navbar */}
      <Paper w="100%" withBorder p="md" shadow="lg">
        <Group w="100%" justify="space-between">
          <Group>
            <Button
              onClick={() => {
                navigate('/');
              }}
              variant="transparent"
              size="xl"
              leftSection={<Text size="2rem">🍺</Text>}
            >
              Evidenca piva
            </Button>
          </Group>

          <Group
            onClick={spotlight.open}
            display={!matches ? 'none' : undefined}
          >
            <Box>
              <Kbd>ctrl</Kbd> + <Kbd>K</Kbd>
            </Box>
            <Text fw="bold">meni</Text>
          </Group>
          <Tooltip label={'Odjava'}>
            <ActionIcon
              p="md"
              variant="subtle"
              onClick={() => {
                supabaseClient.auth.signOut();
              }}
            >
              <IconLogout />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Paper>
    </>
  );
};
