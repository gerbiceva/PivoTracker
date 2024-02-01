import { Button, Group, Paper, Text } from "@mantine/core";
import { supabaseClient } from "../../../supabase/supabaseClient";

export const Navbar = () => {

    return (<Paper w="100%" withBorder p="md">
        <Group w="100%" justify="space-between">
            <Group>
                <Text size="2rem">
                    🍺
                </Text>
                <Text fw="bold" size="xl">
                    Evidenca piva
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