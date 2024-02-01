import { Box, Button, Group, Kbd, Paper, Text } from "@mantine/core";
import { supabaseClient } from "../../../supabase/supabaseClient";
import { IconDoorExit, IconLogout, IconLogout2 } from "@tabler/icons-react";
import { spotlight } from '@mantine/spotlight';
import { useMediaQuery } from '@mantine/hooks';



export const Navbar = () => {
    const matches = useMediaQuery('(min-width: 56.25em)');

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
            <Group onClick={spotlight.open} display={!matches ? "none" : undefined}>
                <Box>
                    <Kbd>ctrl</Kbd> + <Kbd>K</Kbd>
                </Box>
                <Text fw="bold">
                    meni
                </Text>
            </Group>
            <Button
                onClick={() => {
                    supabaseClient.auth.signOut();
                }}
            >
                <Group>
                    <Text size="sm">Odjava</Text> 
                    <IconLogout/>
                </Group>
            </Button>
        </Group>
    </Paper>)
}