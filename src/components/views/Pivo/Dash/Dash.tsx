import {
  ActionIcon,
  Alert,
  Button,
  Divider,
  Group,
  LoadingOverlay,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconBolt,
  IconChevronLeft,
  IconChevronRight,
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
import { formatCurrency } from '../../../../utils/Converter';
import { StatElement } from './StatElement';
import { StatsRing } from './StatsRing';
import { useGetTotalSummary } from './UseGetDash';
import { useLiveTransactions } from '../../../hooks.ts/liveTransactionsHook';
import { Transactiongraph } from '../Transactions/TransactionGraph';
import { HistoryBarChart } from './HistoryBarChart';
import { useGetWeeklyBars } from './useGetWeeklyBars';
import { useGetNabava } from '../Nabava/UseGetNabava';
import { DatePickerInput } from '@mantine/dates';
import { useDateManager } from './useDateManager';

export const Dashboard = () => {
  const { transactions } = useLiveTransactions();
  const bars = useGetWeeklyBars();
  const { dateFrom, dateTo, nextEpoch, prevEpoch } = useDateManager();

  const {
    data: dashboardData,
    error,
    isLoading,
  } = useGetTotalSummary(dateFrom, dateTo);
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
      <Paper p="md" bg="rgba(0,0,0,0)">
        {error && (
          <Alert icon={<IconExclamationCircle />} title="Napaka">
            Statistike ni mogoče naložiti
          </Alert>
        )}
        {!error && (
          <Stack justify="space-between" gap="3rem">
            <Transactiongraph transactions={transactions} />
            <HistoryBarChart {...bars} />

            <Divider my="3rem" label="Letna statistika"></Divider>

            <Group w="100%" justify="end" wrap="nowrap" align="center">
              <ActionIcon variant="subtle" onClick={prevEpoch}>
                <IconChevronLeft />
              </ActionIcon>
              <DatePickerInput
                value={dateFrom}
                readOnly
                placeholder="Pick date"
                size="xs"
                variant="unstyled"
              />
              <Divider orientation="vertical" my="8px"></Divider>

              <DatePickerInput
                value={dateTo}
                readOnly
                placeholder="Pick date"
                size="xs"
                variant="unstyled"
              />
              <ActionIcon variant="subtle" onClick={nextEpoch}>
                <IconChevronRight />
              </ActionIcon>
            </Group>

            <Stack gap="sm">
              <SimpleGrid cols={{ md: 2, sm: 1 }} spacing="sm" p="0px">
                <Alert p="0" variant="light" color="gray">
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
                <Alert p="0" variant="light" color="gray">
                  <StatElement
                    description="Razlika med uloženim denarjem in vrednostjo nakupljenega piva"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0)',
                    }}
                    withBorder={false}
                    m={0}
                    title={'Profit po plačanih dolgovih'}
                    value={formatCurrency(
                      (dashboardData?.total_value || 0) - moneySpentByGerba,
                    )}
                    diff={0}
                    Icon={IconBolt}
                  />
                </Alert>
              </SimpleGrid>
              <SimpleGrid cols={{ md: 3, sm: 1 }} spacing="sm" p="0px">
                <StatElement
                  description="prodanih piv"
                  title={'Količina'}
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
                  title={'Znesek'}
                  description="prodanih piv"
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
