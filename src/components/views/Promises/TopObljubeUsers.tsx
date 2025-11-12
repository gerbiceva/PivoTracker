import {
  Container,
  Stack,
  Title,
  Text,
  Table,
  TableTh,
  TableTr,
  TableTd,
  Alert,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Card,
  Badge,
} from '@mantine/core';
import { UserTag } from '../../users/UserTag';
import { getSupaWR } from '../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../supabase/supabaseClient';

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
  const { data: obljuve, error, isLoading } = getSupaWR({
    query: () => 
      supabaseClient
        .from('obljube')
        .select(`
          who,
          amount,
          base_users!who(name, surname)
        `)
        .order('created_at', { ascending: false }),
    table: 'obljube',
  });

  // Process the data to get top 5 users with highest sum of amounts
  const topUsers: TopUser[] = obljuve ? (() => {
    // Group by user and sum the amounts
    const userAmountsMap: Record<number, { total: number; name: string; surname: string | null }> = {};
    
    obljuve.forEach((obljuba: Obljuba) => {
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
    const userAmountsArray = Object.entries(userAmountsMap).map(([userId, userData]) => ({
      who: parseInt(userId),
      user_name: userData.name,
      user_surname: userData.surname,
      total_amount: userData.total,
    }));

    // Sort by total amount in descending order and take top 5
    return userAmountsArray
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 5);
  })() : [];

  if (error) {
    return (
      <Container>
        <Alert color="red" title="Error loading top users">
          {error.message}
        </Alert>
      </Container>
    );
  }

  const rows = topUsers.map((user, index) => {
    const userFullName = user.user_name + (user.user_surname ? ' ' + user.user_surname : '');
    const position = index + 1;

    return (
      <TableTr key={user.who}>
        <TableTd>
          <Badge size="lg" variant="filled" color={position <= 3 ? (position === 1 ? 'yellow' : position === 2 ? 'gray' : 'orange') : 'blue'}>
            {position}
          </Badge>
        </TableTd>
        <TableTd>
          <UserTag
            fullname={userFullName || 'N/A'}
            id={user.who?.toString() || ''}
          />
        </TableTd>
        <TableTd>
          <Text fw={700} size="lg" color="red">
            {user.total_amount}
          </Text>
        </TableTd>
      </TableTr>
    );
  });

  return (
    <Container size="md">
      <Stack gap="xl">
        <Title order={1}>Komu tezit za pivo:</Title>
        
        {/* <Paper shadow="sm" p="md" withBorder>
          <Text size="lg" mb="md">
            The top 5 users with the biggest sum of obligations (obljube)
          </Text>
          
          <LoadingOverlay visible={isLoading} />
          
          <Table striped highlightOnHover withColumnBorders>
            <Table.Thead>
              <TableTr>
                <TableTh>Position</TableTh>
                <TableTh>User</TableTh>
                <TableTh>Total Amount</TableTh>
              </TableTr>
            </Table.Thead>
            <Table.Tbody>
              {topUsers.length > 0 ? (
                rows
              ) : (
                <TableTr>
                  <TableTd colSpan={3}>
                    <Text ta="center">No obljuve data available</Text>
                  </TableTd>
                </TableTr>
              )}
            </Table.Tbody>
          </Table>
        </Paper> */}

        <Paper shadow="sm" p="md" withBorder>
          <Title order={3} mb="md">Leaderboard</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="md">
            {topUsers.map((user, index) => {
              const userFullName = user.user_name + (user.user_surname ? ' ' + user.user_surname : '');
              const position = index + 1;
              
              return (
                <Card 
                  key={user.who} 
                  shadow="sm" 
                  padding="lg" 
                  radius="md"
                  withBorder
                  style={{
                    border: position === 1 ? '2px solid gold' : 
                           position === 2 ? '2px solid silver' : 
                           position === 3 ? '2px solid #cd7f32' : '1px solid #e9ecef'
                  }}
                >
                  <Stack align="center">
                    <Badge 
                      size="xl" 
                      variant="filled" 
                      color={position === 1 ? 'yellow' : position === 2 ? 'gray' : position === 3 ? 'orange' : 'blue'}
                      style={{ fontSize: '1.5rem' }}
                    >
                      {position}
                    </Badge>
                    <UserTag
                      fullname={userFullName || 'N/A'}
                      id={user.who?.toString() || ''}
                    />
                    <Text fw={700} size="lg" color="red">
                      {user.total_amount} beers
                    </Text>
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
        </Paper>
      </Stack>
    </Container>
  );
};
