import { rem } from '@mantine/core';
import {
  IconBeer,
  IconHome,
  IconList,
  IconLogout,
  IconShoppingBag,
  IconTransactionEuro,
} from '@tabler/icons-react';

// core styles are required for all packages
import { IconSearch } from '@tabler/icons-react';
import { Spotlight, SpotlightActionData } from '@mantine/spotlight';
import { supabaseClient } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';
export const CustomSpotlight = () => {
  const navigate = useNavigate();
  const Spotlightactions: SpotlightActionData[] = [
    {
      id: 'home',
      label: 'Domov',
      description: 'Prva stran',
      onClick: () => navigate('/'),
      leftSection: (
        <IconHome style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
      ),
    },
    {
      id: 'add',
      label: 'Dodajanje piva',
      description: 'Prodaj pivo stranki',
      onClick: () => navigate('/add'),
      leftSection: (
        <IconBeer style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
      ),
    },
    {
      id: 'list',
      label: 'Seznam pufov',
      description: 'Prikaži seznam pufov',
      onClick: () => navigate('/puff'),
      leftSection: (
        <IconList style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
      ),
    },
    {
      id: 'transactions',
      label: 'Transakcije',
      description: 'Prikaži vse transakcije',
      onClick: () => navigate('/transactions'),
      leftSection: (
        <IconTransactionEuro
          style={{ width: rem(24), height: rem(24) }}
          stroke={1.5}
        />
      ),
    },
    {
      id: 'nabava',
      label: 'Nabava',
      description: 'Nabava piva iz trgovine',
      onClick: () => window.location.replace('/nabava'),
      leftSection: (
        <IconShoppingBag
          style={{ width: rem(24), height: rem(24) }}
          stroke={1.5}
        />
      ),
    },
    {
      id: 'logout',
      label: 'Odjava',
      description: 'Odjavi se iz sistema',
      onClick: () => {
        supabaseClient.auth.signOut();
      },
      leftSection: (
        <IconLogout style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
      ),
    },
    // supabaseClient.auth.signOut();
  ];
  return (
    <Spotlight
      actions={Spotlightactions}
      nothingFound="Nothing found..."
      highlightQuery
      searchProps={{
        leftSection: (
          <IconSearch
            style={{ width: rem(20), height: rem(20) }}
            stroke={1.5}
          />
        ),
        placeholder: 'Search...',
      }}
    />
  );
};
