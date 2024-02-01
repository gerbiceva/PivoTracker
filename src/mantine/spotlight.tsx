import { rem } from "@mantine/core";
import { IconBeer, IconDashboard, IconFileText, IconHome, IconList, IconTransactionEuro } from "@tabler/icons-react";

const Spotlightactions: SpotlightActionData[] = [
  {
    id: "add",
    label: "Dodajanje piva",
    description: "Prodaj pivo stranki",
    onClick: () => window.location.replace("/"),
    leftSection: (
      <IconBeer style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
    ),
  },
  {
    id: "list",
    label: "Puff listek",
    description: "Prikaži seznam pufov",
    onClick: () => window.location.replace("/puff"),
    leftSection: (
      <IconList style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
    ),
  },
  {
    id: "transactions",
    label: "Transakcije",
    description: "Prikaži vse transakcije",
    onClick: () => window.location.replace("/transactions"),
    leftSection: (
      <IconTransactionEuro style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
    ),
  },
];

// core styles are required for all packages
import { IconSearch } from "@tabler/icons-react";
import { Spotlight, SpotlightActionData } from "@mantine/spotlight";
export const CustomSpotlight = () => (
  <Spotlight
    actions={Spotlightactions}
    nothingFound="Nothing found..."
    highlightQuery
    searchProps={{
      leftSection: (
        <IconSearch style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
      ),
      placeholder: "Search...",
    }}
  />
);
