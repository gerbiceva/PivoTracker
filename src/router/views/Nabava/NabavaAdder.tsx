import {
  Box,
  Button,
  NumberInput,
  Paper,
  Stack,
  filterProps,
} from "@mantine/core";
import { useFocusTrap } from "@mantine/hooks";
import { IconBeer, IconCurrencyEuro } from "@tabler/icons-react";
import { nabava, useAddNabava, useGetNabava } from "./NabavaGetterHook";
import { Tables } from "../../../supabase/supabase";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { json } from "react-router-dom";

export const NabavaAdder = () => {
  const focusTrapRef = useFocusTrap();
  const { data, error, isLoading: isLoadingNabava, mutate } = useGetNabava();
  const { add, isLoading } = useAddNabava();

  const form = useForm<nabava>({
    initialValues: {
      cena: 0,
      stevilo_piv: 0,
    },

    validate: {
      cena: (value) => (value >= 0 ? null : "Cena mora biti pozitivno"),
      stevilo_piv: (value) =>
        value >= 0 ? null : "Število piv mora biti pozitivno",
    },
  });

  return (
    <form
      onSubmit={form.onSubmit((data) => {
        add(data).then(() => {
          notifications.show({
            title: "Nabava dodana",
            message: "Nabava je bila uspešno dodana",
          });
        });
        form.reset();
      })}
    >
      <Paper p="md" withBorder shadow="xs">
        <Stack ref={focusTrapRef}>
          <NumberInput
            label="Število piv"
            withAsterisk
            placeholder="20"
            leftSection={<IconBeer />}
            {...form.getInputProps("stevilo_piv")}
          />
          <NumberInput
            label="Cena nakupa"
            withAsterisk
            placeholder="30"
            leftSection={<IconCurrencyEuro />}
            {...form.getInputProps("cena")}
          />
          <Box>
            <Button type="submit" loading={isLoading}>
              Dodaj
            </Button>
          </Box>
          {JSON.stringify(data, null, 2)}
        </Stack>
      </Paper>
    </form>
  );
};
