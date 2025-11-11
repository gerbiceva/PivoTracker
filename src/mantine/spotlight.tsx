import { rem } from '@mantine/core';
import {
  IconBeer,
  IconHome,
  IconList,
  IconLogout,
  IconTransactionEuro,
  IconUser,
  IconUserPlus,
  IconWash,
} from '@tabler/icons-react';

// core styles are required for all packages
import { IconSearch } from '@tabler/icons-react';
import { Spotlight, SpotlightActionData } from '@mantine/spotlight';
import { supabaseClient } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { $currUser } from '../global-state/user';
import { useStore } from '@nanostores/react';

interface CustomSpotlighData extends SpotlightActionData {
  permission?: string;
}

interface CustomSpotlightGroupData {
  group: string;
  actions: CustomSpotlighData[];
}

export const CustomSpotlight = () => {
  const navigate = useNavigate();

  const user = useStore($currUser);
  const permissions = user?.permissions || [];

  let Spotlightactions: CustomSpotlightGroupData[] = (
    [
      {
        group: 'Domov',
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
        ],
      },
      {
        group: 'Pivo',
        actions: [
          {
            permission: 'MANAGE_TRANSACTIONS',
            id: 'home',
            label: 'Domov',
            description: 'Prva stran',
            onClick: () => navigate('/pivo'),
            leftSection: (
              <IconHome
                style={{ width: rem(24), height: rem(24) }}
                stroke={1.5}
              />
            ),
          },
          {
            permission: 'MANAGE_TRANSACTIONS',
            id: 'add',
            label: 'Dodajanje piva',
            description: 'Prodaj pivo stranki',
            onClick: () => navigate('/pivo/add'),
            leftSection: (
              <IconBeer
                style={{ width: rem(24), height: rem(24) }}
                stroke={1.5}
              />
            ),
          },
          {
            permission: 'MANAGE_TRANSACTIONS',
            id: 'list',
            label: 'Seznam pufov',
            description: 'Prikaži seznam pufov',
            onClick: () => navigate('/pivo/puf'),
            leftSection: (
              <IconList
                style={{ width: rem(24), height: rem(24) }}
                stroke={1.5}
              />
            ),
          },
          {
            permission: 'MANAGE_TRANSACTIONS',
            id: 'transactions',
            label: 'Transakcije',
            description: 'Prikaži vse transakcije',
            onClick: () => navigate('/pivo/transactions'),
            leftSection: (
              <IconTransactionEuro
                style={{ width: rem(24), height: rem(24) }}
                stroke={1.5}
              />
            ),
          },
          // {
          //   id: 'nabava',
          //   label: 'Nabava',
          //   description: 'Nabava piva iz trgovine',
          //   onClick: () => window.location.replace('/nabava'),
          //   leftSection: (
          //     <IconShoppingBag
          //       style={{ width: rem(24), height: rem(24) }}
          //       stroke={1.5}
          //     />
          //   ),
          // },
          // {
          //   id: 'zaloge',
          //   label: 'Zaloge',
          //   description: 'Zaloge in transakcije ministrov',
          //   onClick: () => window.location.replace('/zaloge'),
          //   leftSection: (
          //     <IconDatabase
          //       style={{ width: rem(24), height: rem(24) }}
          //       stroke={1.5}
          //     />
          //   ),
          // },
        ],
      },
      {
        group: 'Admin',
        actions: [
          {
            permission: 'ENROLL',
            id: 'enroll',
            label: 'Enroll',
            description: 'Dodajaj novega uporabnika',
            onClick: () => window.location.replace('/admin/enroll'),
            leftSection: (
              <IconUserPlus
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
            permission: 'CAN_WASH',
            id: 'pranje',
            label: 'Pranje',
            description: 'Dodaj nov termin za pranje',
            onClick: () => window.location.replace('/pranje/novo'),
            leftSection: (
              <IconWash
                style={{ width: rem(24), height: rem(24) }}
                stroke={1.5}
                color="cyan"
              />
            ),
          },
          {
            permission: 'CAN_WASH',
            id: 'moje-pranje',
            label: 'Moji termini',
            description: 'Pregled rezerviranih terminov za pranje',
            onClick: () => window.location.replace('/pranje/moje'),
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
        group: 'Uporabnik',
        actions: [
          {
            id: 'preglej-profil',
            label: 'Preglej profil',
            description: 'Preglej svoj profil',
            onClick: () => navigate('/user'),
            leftSection: (
              <IconUser
                style={{ width: rem(24), height: rem(24) }}
                stroke={1.5}
              />
            ),
          },
          {
            permission: 'MANAGE_USERS',
            id: 'urejanje-uporabnikov',
            label: 'Urejanje uporabnikov',
            description: 'Urejanje uporabnikov',
            onClick: () => navigate('/user/edit'),
            leftSection: (
              <IconUser
                style={{ width: rem(24), height: rem(24) }}
                stroke={1.5}
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
    ] as CustomSpotlightGroupData[]
  ).map((group) => ({
    ...group,
    actions: group.actions.filter((action) => {
      if (!permissions) {
        return false;
      }

      if (!action.permission) {
        return true;
      }

      if (action.permission) {
        return permissions.includes(action.permission);
      }
      return false;
    }),
  }));

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
