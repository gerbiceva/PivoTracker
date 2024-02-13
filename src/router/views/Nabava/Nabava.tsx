import {
  Alert,
  Avatar,
  Divider,
  Group,
  LoadingOverlay,
  Stack,
  Title,
} from "@mantine/core";
import { NabavaAdder } from "./NabavaAdder";
import { NabavaTable } from "./NabavaTable";
import { useGetNabava } from "./UseGetNabava";

export const Nabava = () => {
  const { data, error, isLoading } = useGetNabava();

  return (
    <Stack pos="relative" py="xl">
      <Title order={2}>Nabava</Title>
      <LoadingOverlay visible={false} />
      <NabavaAdder></NabavaAdder>
      {error && (
        <Alert color="red" title="Error displaying nabava">
          {error.message}
        </Alert>
      )}
      {data && (
        <NabavaTable
          data={data}
          error={error}
          isLoading={isLoading}
        ></NabavaTable>
      )}
    </Stack>
  );
};
