import {
  Button,
  Center,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconArrowsDiff,
  IconBeer,
  IconGraph,
  IconHomeStats,
  IconPigMoney,
  IconPlus,
  IconScale,
  IconShoppingBag,
} from "@tabler/icons-react";
import { useGetDash } from "./UseGetDash";
import { StatElement } from "./StatElement";
import { intToEur, numberToEur, pivoVGajba } from "../../../utils/Converter";
import { StatsRing } from "./StatsRing";

export const Dashboard = () => {
  const { data, error, isLoading } = useGetDash();
  const owed = pivoVGajba(
    data?.total_ordered || 0,
    (data?.total_paid || 0) / 10
  );
  const paid = intToEur(data?.total_paid || 0);
  const covered = Math.abs((owed / paid) * 100);

  //   stat 2
  const kupljenega = data?.total_stevilo_piv || 0;
  const prodanega = data?.total_ordered || 0;
  return (
    <Center h="100%">
      <Paper p="xl">
        <Stack justify="space-between">
          <SimpleGrid cols={4} spacing={40}>
            <StatElement
              title={"Prodanega piva"}
              value={data?.total_ordered || 0}
              diff={0}
              Icon={IconShoppingBag}
            />
            <StatElement
              title={"Plačano"}
              value={numberToEur((data?.total_paid || 0) / 10)}
              diff={0}
              Icon={IconPigMoney}
            />
            <StatElement
              title={"Vloženega denarja"}
              value={numberToEur((data?.total_cena || 0) / 10)}
              diff={0}
              Icon={IconGraph}
            />
            <StatElement
              title={"Kupljenega piva"}
              value={data?.total_stevilo_piv || 0}
              diff={0}
              Icon={IconBeer}
            />
          </SimpleGrid>
          <SimpleGrid cols={2} spacing={40}>
            <StatsRing
              label={"Delež pokritega piva"}
              stats={`Še ${numberToEur(Math.abs(owed))} dolga`}
              sections={[
                {
                  color: owed > paid ? "red" : "green",
                  value: owed > paid ? covered : 100 - covered,
                },
              ]}
              Icon={IconScale}
            />
            <StatsRing
              label={"Delež na zalogi"}
              stats={`Še ${kupljenega - prodanega} piv.`}
              sections={[
                {
                  color: "grape",
                  value: (prodanega / kupljenega) * 100,
                },
              ]}
              Icon={IconScale}
            />
          </SimpleGrid>
          <Divider label="Links" py="xl"></Divider>
          <Group justify="space-between">
            <Button
              size="md"
              leftSection={<IconPlus></IconPlus>}
              variant="outline"
            >
              Dodaj piva
            </Button>
            <Button size="md" leftSection={<IconPigMoney />} variant="outline">
              Preglej pufe
            </Button>
            <Button size="md" leftSection={<IconHomeStats />} variant="outline">
              Statistika
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Center>
  );
};
