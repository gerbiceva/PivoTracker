import { BarChart } from '@mantine/charts';
import { Alert, Box, LoadingOverlay, Paper, Text } from '@mantine/core';
import { Tables } from '../../../../supabase/supabase';
import { formatCurrency } from '../../../../utils/Converter';

interface ChartTooltipProps {
  label: string;
  payload: Record<string, any>[] | undefined;
}

function ChartTooltip({ label, payload }: ChartTooltipProps) {
  if (!payload) return null;

  return (
    <Paper px="md" py="sm" withBorder shadow="md" radius="md">
      <Text fw={500} mb={5}>
        Datum: {label}
      </Text>

      {payload.map((item: any) => (
        <Text fw="500" key={item.name} c={item.color} fz="sm">
          {item.name}: {formatCurrency(item.value)} €
        </Text>
      ))}
    </Paper>
  );
}

interface IHistoryBarChartProps {
  data?: Tables<'weekly_summary'>[];
  isLoading: boolean;
  error?: Error;
}

export const HistoryBarChart = ({
  data,
  isLoading,
  error,
}: IHistoryBarChartProps) => {
  return (
    <Box pos="relative">
      <LoadingOverlay visible={isLoading} />
      {!error && data && (
        <BarChart
          h={300}
          data={data.map((val) => {
            return {
              total_ordered: val.total_ordered,
              // total_value: val.total_value,
              total_paid: val.total_paid,
              week_start: new Date(val.week_start || '').toLocaleDateString(),
            };
          })}
          dataKey="week_start"
          title="Tedenska naliza prodaje"
          series={[
            { name: 'total_ordered', color: 'gray', label: 'Naročeno' },
            // { name: 'total_value', color: 'gray.6', label: 'Vrednost €' },
            { name: 'total_paid', color: 'cyan', label: 'Plačano €' },
          ]}
          tooltipProps={{
            content: ({ label, payload }) => (
              <ChartTooltip
                label={label?.toLocaleString() || ''}
                payload={payload}
              />
            ),
          }}
          valueFormatter={(val) => val.toString()}
          fillOpacity={0.7}
          withLegend
          withYAxis={false}
        />
      )}
      {error && (
        <Alert title={error.name} c="red" variant="light">
          {error.message}
        </Alert>
      )}
    </Box>
  );
};
