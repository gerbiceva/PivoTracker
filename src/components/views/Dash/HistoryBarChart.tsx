import { BarChart } from '@mantine/charts';
import { Alert, Box, LoadingOverlay, Paper, Text } from '@mantine/core';
import { Tables } from '../../../supabase/supabase';
import { numberToEur } from '../../../utils/Converter';

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
          {item.name}: {numberToEur(item.value)} €
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
              ...val,
              week_start: new Date(val.week_start || '').toLocaleDateString(),
            };
          })}
          dataKey="week_start"
          title="Tedenska naliza prodaje"
          series={[
            { name: 'pivo_v_gajba', color: 'orange.6', label: ' pivo v gajba' },
            { name: 'total_ordered', color: 'yellow.6', label: 'naročeno' },
            { name: 'total_paid', color: 'grape.6', label: 'plačano' },
          ]}
          tooltipProps={{
            content: ({ label, payload }) => (
              <ChartTooltip label={label} payload={payload} />
            ),
          }}
          valueFormatter={(val) => (val / 100).toString()}
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
