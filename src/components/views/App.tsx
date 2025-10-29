import { Container, Stack } from '@mantine/core';
import { Navbar } from './Navbar/Nav';
import { CustomSpotlight } from '../../mantine/spotlight';
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <Stack p="0">
      <img
        src="/GerbaLogo.svg"
        alt=""
        style={{
          position: 'absolute',
          zIndex: -100,
          opacity: 0.04,
          maxHeight: '90vh',
          maxWidth: '90vw',
        }}
      />
      <Navbar />
      <CustomSpotlight />
      <Container
        size="xl"
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
