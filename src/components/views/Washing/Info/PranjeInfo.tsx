import { Button, Container, Stack, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export const PranjeInfo = () => {
  return (
    <Container>
      <Stack>
        <Title>Pravila pranja</Title>
        Maja, desna roka bo napisala tukaj vse potrebno za težit brucom
        <p>
          Nove termine lahko dodaš na strani
          <Button variant="subtle" component={Link} to="/pranje/novo">
            Dodaj termin
          </Button>
          .
        </p>
        <p>
          Nove termine lahko dodaš na strani
          <Button variant="subtle" component={Link} to="/pranje/moje">
            Pregled pranja
          </Button>
          .
        </p>
      </Stack>
    </Container>
  );
};
