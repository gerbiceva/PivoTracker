import {
  Badge,
  Box,
  Burger,
  Button,
  Group,
  Kbd,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { spotlight } from '@mantine/spotlight';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../supabase/loader';

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
          variant="dot"
          style={{
            zIndex: 1,
          }}
        >
          {user?.email || 'Neprijavljen'}
        </Badge>
      </Tooltip>
      {/* navbar */}
      <Paper w="100%" withBorder px="xl" shadow="lg">
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

          <Burger
            onClick={spotlight.open}
            display={!matches ? undefined : 'none'}
          />

          <Group
            onClick={spotlight.open}
            display={!matches ? 'none' : undefined}
          >
            <Box>
              <Kbd>ctrl</Kbd> + <Kbd>K</Kbd>
            </Box>
            <Text fw="bold">meni</Text>
          </Group>
        </Group>
      </Paper>
    </>
  );
};
