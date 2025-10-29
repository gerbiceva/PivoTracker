import { AreaChart } from '@mantine/charts';
import { Paper, Text } from '@mantine/core';
import { useMemo } from 'react';
import { Tables } from '../../../../supabase/supabase';
import { formatCurrency } from '../../../../utils/Converter';
interface ChartTooltipProps {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>[] | undefined;
}

function ChartTooltip({ label, payload }: ChartTooltipProps) {
  if (!payload) return null;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text fw={500} mb={5}>
        Zaporedna številka: {label}
      </Text>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((item: any) => (
        <Text fw="500" key={item.name} c={item.color} fz="sm">
          {item.name}: {formatCurrency(item.value)} €
        </Text>
      ))}
    </Paper>
  );
}

interface ITransactionGraphProps {
  transactions: Tables<'named_transactions'>[];
}

export const Transactiongraph = ({ transactions }: ITransactionGraphProps) => {
  const totalOwedAccumulator = useMemo(() => {
    const trans = transactions.slice().reverse();
    let it = 0;
    return trans.map((val) => {
      return { id: it++, Dolg: val.owed };
    });
  }, [transactions]);

  return (
    <AreaChart
      h={250}
      referenceLines={[{ y: 0, label: 'Zero line', color: 'red.6' }]}
      data={totalOwedAccumulator}
      dataKey="id"
      title="Debt / transactions"
      tooltipProps={{
        content: ({ label, payload }) => (
          <ChartTooltip label={label?.toString() || ''} payload={payload} />
        ),
      }}
      withDots={false}
      type="split"
      fillOpacity={0.15}
      splitColors={['red', 'teal']}
      series={[{ color: 'gray', name: 'Dolg' }]}
      xAxisLabel="trasakcije"
    />
  );
};
