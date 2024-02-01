import { Container, Stack } from "@mantine/core";
import { useStore } from "@nanostores/react";
import { $currUser } from "../../global-state/user";
import { BeerAdded } from "./Adder/Adder";
import { Navbar } from "./Navbar/Nav";
import { Tab } from "./Tabela/Tabela";
import { CustomSpotlight } from "../../mantine/spotlight";
import { Outlet } from "react-router-dom";

function App() {
  const user = useStore($currUser);

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
