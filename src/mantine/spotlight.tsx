import { rem } from "@mantine/core";
import { IconBeer, IconDashboard, IconFileText, IconHome, IconTransactionEuro } from "@tabler/icons-react";

const Spotlightactions: SpotlightActionData[] = [
  {
    id: "add",
    label: "Add Beer",
    description: "Sell beer to a customer",
    onClick: () => window.location.replace("/"),
    leftSection: (
      <IconBeer style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
    ),
  },
  {
    id: "transactions",
    label: "Transactions",
    description: "View all transactions",
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
