import { rem } from '@mantine/core';
import {
  IconBeer,
  IconDatabase,
  IconHome,
  IconList,
  IconLogout,
  IconShoppingBag,
  IconTransactionEuro,
  IconWash,
} from '@tabler/icons-react';

// core styles are required for all packages
import { IconSearch } from '@tabler/icons-react';
import { Spotlight, SpotlightActionGroupData } from '@mantine/spotlight';
import { supabaseClient } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';
export const CustomSpotlight = () => {
  const navigate = useNavigate();
  const Spotlightactions: SpotlightActionGroupData[] = [
    {
      group: 'Pivo',
      actions: [
        {
          id: 'home',
          label: 'Domov',
          description: 'Prva stran',
          onClick: () => navigate('/'),
          leftSection: (
            <IconHome
              style={{ width: rem(24), height: rem(24) }}
              stroke={1.5}
            />
          ),
        },
        {
          id: 'add',
          label: 'Dodajanje piva',
          description: 'Prodaj pivo stranki',
          onClick: () => navigate('/add'),
          leftSection: (
            <IconBeer
              style={{ width: rem(24), height: rem(24) }}
              stroke={1.5}
            />
          ),
        },
        {
          id: 'list',
          label: 'Seznam pufov',
          description: 'Prikaži seznam pufov',
          onClick: () => navigate('/puff'),
          leftSection: (
            <IconList
              style={{ width: rem(24), height: rem(24) }}
              stroke={1.5}
            />
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
          id: 'zaloge',
          label: 'Zaloge',
          description: 'Zaloge in transakcije ministrov',
          onClick: () => window.location.replace('/zaloge'),
          leftSection: (
            <IconDatabase
              style={{ width: rem(24), height: rem(24) }}
              stroke={1.5}
            />
          ),
        },
      ],
    },
    {
      group: 'Pranje',
      actions: [
        {
          id: 'pranje',
          label: 'Pranje',
          description: 'Dodaj nov termin za pranje',
          onClick: () => window.location.replace('/pranje'),
          leftSection: (
            <IconWash
              style={{ width: rem(24), height: rem(24) }}
              stroke={1.5}
              color="cyan"
            />
          ),
        },
        {
          id: 'moje-pranje',
          label: 'Moji termini',
          description: 'Pregled rezerviranih terminov za pranje',
          onClick: () => window.location.replace('/moje-pranje'),
          leftSection: (
            <IconWash
              style={{ width: rem(24), height: rem(24) }}
              stroke={1.5}
              color="cyan"
            />
          ),
        },
      ],
    },
    {
      group: 'Sistem',
      actions: [
        {
          id: 'logout',
          label: 'Odjava',
          description: 'Odjavi se iz sistema',
          onClick: () => {
            supabaseClient.auth.signOut();
          },
          leftSection: (
            <IconLogout
              style={{ width: rem(24), height: rem(24) }}
              stroke={1.5}
              color="red"
            />
          ),
        },
      ],
    },
  ];
  return (
    <Spotlight
      actions={Spotlightactions}
      nothingFound="Nothing found..."
      highlightQuery
      scrollable
      maxHeight="80vh"
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
