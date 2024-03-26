import {
  Alert,
  Button,
  Center,
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
import { intToEur, numberToEur, pivoVGajba } from '../../../utils/Converter';
import { StatElement } from './StatElement';
import { StatsRing } from './StatsRing';
import { useGetDash } from './UseGetDash';

export const Dashboard = () => {
  const { data, error, isLoading } = useGetDash();
  const owed = pivoVGajba(
    data?.total_ordered || 0,
    (data?.total_paid || 0) / 10,
  );
  const paid = intToEur(data?.total_paid || 0);

  //   stat 2
  const kupljenega = data?.total_stevilo_piv || 0;
  const prodanega = data?.total_ordered || 0;

  const navigate = useNavigate();
  return (
    <ScrollArea h="100%">
      <Center h="100%">
        <LoadingOverlay visible={isLoading} />
        <Paper p="md">
          {error && (
            <Alert icon={<IconExclamationCircle />} title="Napaka">
              Statistike ni mogoče naložiti
            </Alert>
          )}
          {!error && (
            <Stack justify="space-between">
              <SimpleGrid cols={{ md: 4, sm: 2 }} spacing={40}>
                <StatElement
                  title={'Prodanega piva'}
                  value={data?.total_ordered || 0}
                  diff={0}
                  Icon={IconShoppingBag}
                />
                <StatElement
                  title={'Plačano'}
                  value={numberToEur((data?.total_paid || 0) / 10)}
                  diff={0}
                  Icon={IconPigMoney}
                />
                <StatElement
                  title={'Vloženega denarja'}
                  value={numberToEur((data?.total_cena || 0) / 10)}
                  diff={0}
                  Icon={IconGraph}
                />
                <StatElement
                  title={'Kupljenega piva'}
                  value={data?.total_stevilo_piv || 0}
                  diff={0}
                  Icon={IconBeer}
                />
              </SimpleGrid>
              <SimpleGrid cols={{ md: 2, sm: 1 }} spacing={40}>
                {owed > 0 && (
                  <StatsRing
                    label={'Delež pokritega dolga'}
                    stats={`Še ${numberToEur(Math.abs(owed))} dolga`}
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
                    stats={`${numberToEur(Math.abs(owed))} profita`}
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
                  stats={`Še ${kupljenega - prodanega} piv.`}
                  sections={[
                    {
                      color: 'grape',
                      value: Math.max(0, (prodanega / kupljenega) * 100),
                    },
                  ]}
                  Icon={IconStack}
                />
              </SimpleGrid>
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
      </Center>
    </ScrollArea>
  );
};
