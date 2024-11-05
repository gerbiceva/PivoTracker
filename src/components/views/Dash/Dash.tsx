import {
  Alert,
  Button,
  Divider,
  LoadingOverlay,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconBolt,
  IconExclamationCircle,
  IconGraph,
  IconHomeStats,
  IconPigMoney,
  IconPlus,
  IconScale,
  IconShoppingBag,
  IconStack,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../utils/Converter';
import { StatElement } from './StatElement';
import { StatsRing } from './StatsRing';
import { useGetTotalSummary } from './UseGetDash';
import { useLiveTransactions } from '../../hooks.ts/liveTransactionsHook';
import { Transactiongraph } from '../Transactions/TransactionGraph';
import { HistoryBarChart } from './HistoryBarChart';
import { useGetWeeklyBars } from './useGetWeeklyBars';
import { useGetNabava } from '../Nabava/UseGetNabava';

export const Dashboard = () => {
  const { transactions } = useLiveTransactions();
  const bars = useGetWeeklyBars();
  const { data: dashboardData, error, isLoading } = useGetTotalSummary();
  const { data: nabava } = useGetNabava();

  const owed = dashboardData?.total_debt || 0;

  //   stat 2
  const beersBoughtByGerba =
    nabava?.reduce((prev, curr) => (prev += curr.beer_count), 0) || 0;
  const moneySpentByGerba =
    nabava?.reduce((prev, curr) => (prev += curr.price), 0) || 0;

  const beersSold = dashboardData?.total_ordered || 0;

  const navigate = useNavigate();
  return (
    <ScrollArea h="100%">
      <LoadingOverlay visible={isLoading} />
      <Paper p="md">
        {error && (
          <Alert icon={<IconExclamationCircle />} title="Napaka">
            Statistike ni mogoče naložiti
          </Alert>
        )}
        {!error && (
          <Stack justify="space-between" gap="3rem">
            <Transactiongraph transactions={transactions} />

            <Stack gap="sm">
              <Alert p="0" variant="outline" color="gray">
                <StatElement
                  style={{
                    backgroundColor: 'rgba(0,0,0,0)',
                  }}
                  withBorder={false}
                  m={0}
                  title={'Gerba profit'}
                  value={formatCurrency(
                    (dashboardData?.total_paid || 0) - moneySpentByGerba,
                  )}
                  diff={0}
                  Icon={IconBolt}
                />
              </Alert>
              <SimpleGrid cols={{ md: 3, sm: 1 }} spacing="sm" p="0px">
                <StatElement
                  title={'Prodanega piva'}
                  value={dashboardData?.total_ordered || 0}
                  diff={0}
                  Icon={IconShoppingBag}
                />
                <StatElement
                  title={'Plačano'}
                  value={formatCurrency(dashboardData?.total_paid || 0)}
                  diff={0}
                  Icon={IconPigMoney}
                />
                <StatElement
                  title={'Prodano pivo'}
                  value={formatCurrency(dashboardData?.total_value || 0)}
                  diff={0}
                  Icon={IconGraph}
                />
              </SimpleGrid>
              <SimpleGrid cols={{ md: 2, sm: 1 }} spacing="sm" p="0px">
                {owed > 0 && (
                  <StatsRing
                    label={'Delež plačanega dolga'}
                    stats={`Še ${formatCurrency(Math.abs(owed))} dolga`}
                    sections={[
                      {
                        color: 'cyan',
                        value:
                          ((dashboardData?.total_paid || 0) /
                            (dashboardData?.total_value || 0)) *
                          100,
                      },
                    ]}
                    Icon={IconScale}
                  />
                )}

                <StatsRing
                  label={'Delež na zalogi'}
                  stats={`Še ${beersBoughtByGerba - beersSold} piv.`}
                  sections={[
                    {
                      color:
                        beersBoughtByGerba - beersSold >= 0 ? 'grape' : 'red',
                      value: Math.max(
                        0,
                        (beersSold / beersBoughtByGerba) * 100,
                      ),
                    },
                  ]}
                  Icon={
                    beersBoughtByGerba - beersSold >= 0
                      ? IconStack
                      : IconAlertTriangle
                  }
                />
              </SimpleGrid>
            </Stack>

            <HistoryBarChart {...bars} />

            <Divider label="Links" py="xl"></Divider>
            <SimpleGrid cols={{ md: 3, sm: 2 }}>
              <Button
                size="md"
                leftSection={<IconPlus></IconPlus>}
                variant="outline"
                onClick={() => navigate('/add')}
              >
                Dodaj piva
              </Button>
              <Button
                size="md"
                leftSection={<IconPigMoney />}
                variant="outline"
                onClick={() => navigate('/puff')}
              >
                Preglej pufe
              </Button>
              <Button
                size="md"
                leftSection={<IconHomeStats />}
                variant="outline"
                onClick={() => navigate('/transactions')}
              >
                Statistika
              </Button>
            </SimpleGrid>
          </Stack>
        )}
      </Paper>
    </ScrollArea>
  );
};
