import {
  Alert,
  Badge,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { IconBeer } from '@tabler/icons-react';

export const TopObljubeUsers = () => {
  const { data: topUsers, error } = getSupaWR({
    query: () =>
      supabaseClient
        .from('top_obljube_users_sum')
        .select('*')
        .order('total_amount', { ascending: false })
        .limit(30),
    table: 'obljube',
  });

  if (error) {
    return (
      <Container>
        <Alert color="red" title="Error loading top users">
          {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md">
      <Stack gap="xl">
        <Title order={1}>Komu težit za pivo?</Title>

        <Title order={3} mb="md">
          Leaderboard
        </Title>

        <Group w="100%" justify="space-around" my="4rem">
          {topUsers && topUsers[1] && (
            <Alert p="xl" mt="-2rem" variant="outline" color="gray">
              <Stack justify="center" align="center">
                <ThemeIcon color="gray" size="xl" variant="light">
                  2
                </ThemeIcon>
                <Group align="center" justify="center">
                  <Text p="0" size="xl" c="dimmed">
                    {topUsers[1].total_amount}
                  </Text>
                  <IconBeer opacity={0.3} />
                </Group>
                {/* <UserTag
                  fullname={
                    topUsers[1].user_name + ' ' + topUsers[1].user_surname
                  }
                  id={(topUsers[1].who || 0).toString()}
                /> */}
                <Text>
                  {topUsers[1].user_name + ' ' + topUsers[1].user_surname}
                </Text>
              </Stack>
            </Alert>
          )}

          {topUsers && topUsers[0] && (
            <Alert p="xl" mt="-6rem" variant="outline" color="yellow">
              <Stack justify="center" align="center">
                <ThemeIcon color="yellow" size="xl" variant="light">
                  1
                </ThemeIcon>
                <Group align="center" justify="center">
                  <Text p="0" size="xl" c="dimmed">
                    {topUsers[0].total_amount}
                  </Text>
                  <IconBeer opacity={0.3} />
                </Group>
                {/* <UserTag
                  fullname={
                    topUsers[0].user_name + ' ' + topUsers[0].user_surname
                  }
                  id={(topUsers[0].who || 0).toString()}
                /> */}
                <Text>
                  {topUsers[0].user_name + ' ' + topUsers[0].user_surname}
                </Text>
              </Stack>
            </Alert>
          )}

          {topUsers && topUsers[2] && (
            <Alert p="xl" variant="outline" color="orange">
              <Stack justify="center" align="center">
                <ThemeIcon color="orange" size="xl" variant="light">
                  3
                </ThemeIcon>
                <Group align="center" justify="center">
                  <Text p="0" size="xl" c="dimmed">
                    {topUsers[2].total_amount}
                  </Text>
                  <IconBeer opacity={0.3} />
                </Group>

                {/* <UserTag
                  fullname={
                    topUsers[2].user_name + ' ' + topUsers[2].user_surname
                  }
                  id={(topUsers[0].who || 0).toString()}
                /> */}
                <Text>
                  {topUsers[2].user_name + ' ' + topUsers[2].user_surname}
                </Text>
              </Stack>
            </Alert>
          )}
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="md">
          {topUsers?.slice(3, 30).map((user, index) => {
            const userFullName =
              user.user_name +
              (user.user_surname ? ' ' + user.user_surname : '');
            const position = index + 4;

            return (
              <Card
                key={user.who}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
              >
                <Stack align="center">
                  <Badge size="lg" variant="light" color="gray">
                    {position}
                  </Badge>
                  <Text fw={700} size="lg" c="gray">
                    {user.total_amount}
                  </Text>

                  {/* <UserTag
                    fullname={userFullName || 'N/A'}
                    id={user.who?.toString() || ''}
                  /> */}

                  <Text size="md" c="gray">
                    {userFullName}
                  </Text>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Container>
  );
};
