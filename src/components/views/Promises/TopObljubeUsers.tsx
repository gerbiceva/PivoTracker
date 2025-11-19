import {
  Alert,
  Badge,
  Card,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { UserTag } from '../../users/UserTag';
import { IconBeer } from '@tabler/icons-react';

interface Obljuba {
  who: number;
  amount: number;
  base_users: {
    name: string;
    surname: string | null;
  };
}

interface TopUser {
  who: number;
  user_name: string;
  user_surname: string | null;
  total_amount: number;
}

export const TopObljubeUsers = () => {
  const { data: obljube, error } = getSupaWR({
    query: () =>
      supabaseClient
        .from('obljube')
        .select(
          `
          who,
          amount,
          base_users!who(name, surname)
        `,
        )
        .limit(15)
        .order('created_at', { ascending: false }),
    table: 'obljube',
  });

  // Process the data to get top 5 users with highest sum of amounts
  const topUsers: TopUser[] = obljube
    ? (() => {
        // Group by user and sum the amounts
        const userAmountsMap: Record<
          number,
          { total: number; name: string; surname: string | null }
        > = {};

        obljube.forEach((obljuba: Obljuba) => {
          if (!userAmountsMap[obljuba.who]) {
            userAmountsMap[obljuba.who] = {
              total: 0,
              name: obljuba.base_users?.name || 'Unknown',
              surname: obljuba.base_users?.surname || null,
            };
          }
          userAmountsMap[obljuba.who].total += obljuba.amount || 0;
        });

        // Convert to array and sort by total amount
        const userAmountsArray = Object.entries(userAmountsMap).map(
          ([userId, userData]) => ({
            who: parseInt(userId),
            user_name: userData.name,
            user_surname: userData.surname,
            total_amount: userData.total,
          }),
        );

        // Sort by total amount in descending order and take top 5
        return userAmountsArray
          .sort((a, b) => b.total_amount - a.total_amount)
          .slice(0, 5);
      })()
    : [];

  if (error) {
    return (
      <Container>
        <Alert color="red" title="Error loading top users">
          {error.message}
        </Alert>
      </Container>
    );
  }

  // const rows = topUsers.map((user, index) => {
  //   const userFullName =
  //     user.user_name + (user.user_surname ? ' ' + user.user_surname : '');
  //   const position = index + 1;

  //   return (
  //     <TableTr key={user.who}>
  //       <TableTd>
  //         <Badge
  //           size="lg"
  //           variant="filled"
  //           color={
  //             position <= 3
  //               ? position === 1
  //                 ? 'yellow'
  //                 : position === 2
  //                 ? 'gray'
  //                 : 'orange'
  //               : 'blue'
  //           }
  //         >
  //           {position}
  //         </Badge>
  //       </TableTd>
  //       <TableTd>
  //         <UserTag
  //           fullname={userFullName || 'N/A'}
  //           id={user.who?.toString() || ''}
  //         />
  //       </TableTd>
  //       <TableTd>
  //         <Text fw={700} size="lg" color="red">
  //           {user.total_amount}
  //         </Text>
  //       </TableTd>
  //     </TableTr>
  //   );
  // });

  return (
    <Container size="md">
      <Stack gap="xl">
        <Title order={1}>Komu tezit za pivo:</Title>

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
                <UserTag
                  fullname={
                    topUsers[1].user_name + ' ' + topUsers[1].user_surname
                  }
                  id={topUsers[1].who.toString()}
                />
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
                <UserTag
                  fullname={
                    topUsers[0].user_name + ' ' + topUsers[0].user_surname
                  }
                  id={topUsers[0].who.toString()}
                />
              </Stack>
            </Alert>
          )}

          {topUsers && topUsers[2] && (
            <Alert p="xl" variant="outline" color="orange">
              <Stack justify="center" align="center">
                <ThemeIcon color="orange" size="xl" variant="light">
                  1
                </ThemeIcon>
                <Group align="center" justify="center">
                  <Text p="0" size="xl" c="dimmed">
                    {topUsers[2].total_amount}
                  </Text>
                  <IconBeer opacity={0.3} />
                </Group>
                <UserTag
                  fullname={
                    topUsers[2].user_name + ' ' + topUsers[2].user_surname
                  }
                  id={topUsers[2].who.toString()}
                />
              </Stack>
            </Alert>
          )}
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="md">
          {topUsers.slice(3).map((user, index) => {
            const userFullName =
              user.user_name +
              (user.user_surname ? ' ' + user.user_surname : '');
            const position = index + 1;

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
                  <UserTag
                    fullname={userFullName || 'N/A'}
                    id={user.who?.toString() || ''}
                  />
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Container>
  );
};
