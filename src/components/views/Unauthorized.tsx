import { Title, Text, Button, Group, Center, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Center h="100vh">
      <Stack align="center" gap="sm">
        <Title>Neavtoriziran</Title>
        <Text c="dimmed" size="lg" ta="center">
          Za te funckije nimate pravic. Če mislite da je to napaka,
          kontaktirajte ministra
        </Text>
        <Group justify="center" mt="lg">
          <Button onClick={() => navigate('/')} variant="light">
            Nazaj domov
          </Button>
        </Group>
      </Stack>
    </Center>
  );
};
