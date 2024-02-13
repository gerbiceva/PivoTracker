import { Badge, Box, Button, Group, Kbd, Paper, Text } from "@mantine/core";
import { supabaseClient } from "../../../supabase/supabaseClient";
import { spotlight } from "@mantine/spotlight";
import { useMediaQuery } from "@mantine/hooks";
import { useUser } from "../../../supabase/loader";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const matches = useMediaQuery("(min-width: 56.25em)");
  const { loading, user } = useUser();
  const navigate = useNavigate();

  return (
    <Paper w="100%" withBorder p="md" shadow="lg">
      <Group w="100%" justify="space-between">
        <Group>
          <Button
            onClick={() => {
              navigate("/");
            }}
            variant="transparent"
            size="xl"
            leftSection={<Text size="2rem">🍺</Text>}
          >
            Evidenca piva
          </Button>
        </Group>
        <Badge size="xs" pos="absolute" bottom={0} left={0} m="xs">
          {user?.id || "Neprijavljen"}
        </Badge>
        <Group onClick={spotlight.open} display={!matches ? "none" : undefined}>
          <Box>
            <Kbd>ctrl</Kbd> + <Kbd>K</Kbd>
          </Box>
          <Text fw="bold">meni</Text>
        </Group>
        <Button
          onClick={() => {
            supabaseClient.auth.signOut();
          }}
        >
          <Text size="sm">Odjava</Text>
        </Button>
      </Group>
    </Paper>
  );
};
