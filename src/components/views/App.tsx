import { Container, Stack } from '@mantine/core';
import { Navbar } from './Navbar/Nav';
import { CustomSpotlight } from '../../mantine/spotlight';
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <Stack p="md" h="100vh">
      <img
        src="/GerbaLogo.png"
        alt=""
        style={{
          position: 'absolute',
          zIndex: -100,
          opacity: 0.04,
        }}
      />
      <Navbar />
      <CustomSpotlight />
      <Container
        p={0}
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
