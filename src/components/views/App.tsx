import { Container, Stack } from '@mantine/core';
import { Navbar } from './Navbar/Nav';
import { CustomSpotlight } from '../../mantine/spotlight';
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <Stack p="md" h="100vh">
      <Navbar />
      <CustomSpotlight />
      <Container
        w="100%"
        h="100%"
        style={{
          overflowX: 'hidden',
        }}
      >
        <Outlet />
      </Container>
    </Stack>
  );
}

export default App;
