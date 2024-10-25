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
  IconBeer,
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
import { useGetDash } from './UseGetDash';
import { useLiveTransactions } from '../../hooks.ts/liveTransactionsHook';
import { Transactiongraph } from '../Transactions/TransactionGraph';
import { HistoryBarChart } from './HistoryBarChart';
import { useGetWeeklyBars } from './useGetWeeklyBars';
import { useGetNabava } from '../Nabava/UseGetNabava';

export const Dashboard = () => {
  const { transactions } = useLiveTransactions();
  const bars = useGetWeeklyBars();
  const { data, error, isLoading } = useGetDash();
  const { data: nabava } = useGetNabava();

  const owed = data?.total_debt || 0;
  const paid = data?.total_paid || 0;

  //   stat 2
  const beersBought =
    nabava?.reduce((prev, curr) => (prev += curr.beer_count), 0) || 0;

  const beersSold = data?.total_ordered || 0;

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
              <SimpleGrid cols={{ md: 4, sm: 2 }} spacing="sm" p="0px">
                <StatElement
                  title={'Prodanega piva'}
                  value={data?.total_ordered || 0}
                  diff={0}
                  Icon={IconShoppingBag}
                />
                <StatElement
                  title={'Plačano'}
                  value={formatCurrency((data?.total_paid || 0) / 10)}
                  diff={0}
                  Icon={IconPigMoney}
                />
                <StatElement
                  title={'Vrednost skupaj'}
                  value={formatCurrency((data?.total_value || 0) / 10)}
                  diff={0}
                  Icon={IconGraph}
                />
                <StatElement
                  title={'Kupljenega piva'}
                  value={data?.total_beer_count || 0}
                  diff={0}
                  Icon={IconBeer}
                />
              </SimpleGrid>
              <SimpleGrid cols={{ md: 2, sm: 1 }} spacing="sm" p="0px">
                {owed > 0 && (
                  <StatsRing
                    label={'Delež pokritega dolga'}
                    stats={`Še ${formatCurrency(Math.abs(owed))} dolga`}
                    sections={[
                      {
                        color: 'red',
                        value: (paid / owed) * 100,
                      },
                    ]}
                    Icon={IconScale}
                  />
                )}
                {owed < 0 && (
                  <StatsRing
                    label={'Profit'}
                    stats={`${formatCurrency(Math.abs(owed))} profita`}
                    sections={[
                      {
                        color: 'green',
                        value: 100,
                      },
                    ]}
                    Icon={IconScale}
                  />
                )}
                <StatsRing
                  label={'Delež na zalogi'}
                  stats={`Še ${beersBought - beersSold} piv.`}
                  sections={[
                    {
                      color: 'grape',
                      value: Math.max(0, (beersSold / beersBought) * 100),
                    },
                  ]}
                  Icon={IconStack}
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
