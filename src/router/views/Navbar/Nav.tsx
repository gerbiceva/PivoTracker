import { Box, Button, Group, Kbd, Paper, Text } from "@mantine/core";
import { supabaseClient } from "../../../supabase/supabaseClient";

export const Navbar = () => {

    return (<Paper w="100%" withBorder p="md" shadow="lg">
        <Group w="100%" justify="space-between">
            <Group>
                <Text size="2rem">
                    🍺
                </Text>
                <Text fw="bold" size="xl">
                    Evidenca piva
                </Text>
            </Group>
            <Group>
                <Box>
                    <Kbd>ctrl</Kbd> + <Kbd>K</Kbd>
                </Box>
                <Text fw="bold">
                    menu
                </Text>
            </Group>
            <Button
                onClick={() => {
                    supabaseClient.auth.signOut();
                }}
            >
                logout
            </Button>
        </Group>
    </Paper>)
}