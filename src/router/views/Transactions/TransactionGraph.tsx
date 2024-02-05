import { AreaChart } from "@mantine/charts";
import { Paper, Text } from "@mantine/core";
import { useMemo } from "react";
import { Tables } from "../../../supabase/supabase";
import { numberToEur, pivoVGajba } from "../../../utils/Converter";
interface ChartTooltipProps {
  label: string;
  payload: Record<string, any>[] | undefined;
}

function ChartTooltip({ label, payload }: ChartTooltipProps) {
  if (!payload) return null;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text fw={500} mb={5}>
        Zaporedna številka: {label}
      </Text>
      {payload.map((item: any) => (
        <Text fw="500" key={item.name} c={item.color} fz="sm">
          {item.name}: {numberToEur(item.value)} €
        </Text>
      ))}
    </Paper>
  );
}

interface ITransactionGraphProps {
  transactions: Tables<"named_transactions">[];
}

export const Transactiongraph = ({ transactions }: ITransactionGraphProps) => {
  const totalOwedAccumulator = useMemo(() => {
    const trans = transactions.slice().reverse();
    let total_ordered = 0;
    let total_paid = 0;
    let it = 0;
    return trans.map((val) => {
      total_ordered += val.ordered || 0;
      total_paid += val.paid! / 10 || 0;
      return { id: it++, Dolg: pivoVGajba(total_ordered, total_paid) };
    });
  }, [transactions]);

  return (
    <AreaChart
      h={250}
      data={totalOwedAccumulator}
      dataKey="id"
      tooltipProps={{
        content: ({ label, payload }) => (
          <ChartTooltip label={label} payload={payload} />
        ),
      }}
      withDots={false}
      type="split"
      splitColors={["red", "teal"]}
      series={[{ color: "gray", name: "Dolg" }]}
    />
  );
};
