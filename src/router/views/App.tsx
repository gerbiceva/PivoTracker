import { Container, Stack } from "@mantine/core";
import { Navbar } from "./Navbar/Nav";
import { CustomSpotlight } from "../../mantine/spotlight";
import { Outlet } from "react-router-dom";

function App() {
  return (
    <Stack p="md">
      <Navbar />
      <CustomSpotlight />
      <Container w="100%">
        <Outlet />
      </Container>
    </Stack>
  );
}

export default App;
