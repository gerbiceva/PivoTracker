import {
  Badge,
  Box,
  Burger,
  Group,
  Kbd,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { spotlight } from '@mantine/spotlight';
import { useUser } from '../../../supabase/loader';
import { ColorchemeToggle } from '../../colorshemeToggle/ColorschemeToggle';

export const Navbar = () => {
  const matches = useMediaQuery('(min-width: 56.25em)');
  const { user } = useUser();

  return (
    <Box p="sm">
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
      <Paper w="100%" withBorder px="xl" shadow="lg" py="sm">
        <Group w="100%" justify="space-between">
          <Group
            onClick={spotlight.open}
            style={{ display: matches ? 'flex' : 'none', cursor: 'pointer' }}
          >
            <Box>
              <Kbd>ctrl</Kbd> + <Kbd>K</Kbd>
            </Box>
            <Text fw="bold">meni</Text>
          </Group>

          <Burger
            opened={false}
            onClick={spotlight.open}
            style={{ display: matches ? 'none' : 'block' }}
          />

          <Group>
            <ColorchemeToggle />
          </Group>
        </Group>
      </Paper>
    </Box>
  );
};
