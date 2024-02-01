import { Container, Stack } from "@mantine/core";
import { useStore } from "@nanostores/react";
import { $currUser } from "../../global-state/user";
import { BeerAdded } from "./Adder/Adder";
import { Navbar } from "./Navbar/Nav";
import { Tab } from "./Tabela/Tabela";

function App() {
  const user = useStore($currUser);

  return (
    <Stack p="md">
      <Navbar></Navbar>

      <Container w="100%">
        <Stack>
          <BeerAdded />
          <Tab />
        </Stack>
      </Container>
    </Stack>
  );
}

export default App;
