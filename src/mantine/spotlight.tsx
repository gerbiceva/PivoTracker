import { rem } from '@mantine/core';
import {
  Icon,
  IconBasket,
  IconBeer,
  IconCalendarEvent,
  IconCalendarPlus,
  IconHeartHandshake,
  IconHome,
  IconList,
  IconLogout,
  IconSearch,
  IconShieldCog,
  IconTransactionEuro,
  IconUser,
  IconUserPlus,
  IconUsers,
  IconWash,
} from '@tabler/icons-react';
import {
  Spotlight,
  SpotlightActionData,
  SpotlightActionGroupData,
  SpotlightFilterFunction,
} from '@mantine/spotlight';
import { supabaseClient } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { $currUser } from '../global-state/user';
import { useStore } from '@nanostores/react';
import { ADMIN_TABS } from '../components/views/Admin/Administracija';

interface CustomSpotlighData extends SpotlightActionData {
  id: string;
  // a list means: shown if the user has any of them
  permission?: string | string[];
  // hidden from the default list, only shown when the query matches
  searchOnly?: boolean;
}

interface CustomSpotlightGroupData {
  group: string;
  actions: CustomSpotlighData[];
}

const icon = (TablerIcon: Icon, color?: string) => (
  <TablerIcon
    style={{ width: rem(24), height: rem(24) }}
    stroke={1.5}
    color={color}
  />
);

// icons for the Administracija group, keyed by ADMIN_TABS value
const ADMIN_TAB_ICONS: Record<string, Icon> = {
  dogodki: IconCalendarEvent,
  obljube: IconHeartHandshake,
  uporabniki: IconUsers,
  pivo: IconBeer,
  vloge: IconShieldCog,
};

// lowercase and strip diacritics, so "crnc" matches "Črnč"
const normalize = (value: string) =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

const keywordsText = (keywords: SpotlightActionData['keywords']) =>
  Array.isArray(keywords) ? keywords.join(',') : (keywords ?? '');

const makeFilter =
  (searchOnlyIds: Set<string>): SpotlightFilterFunction =>
  (rawQuery, data) => {
    const query = normalize(rawQuery);

    if (!query) {
      return data
        .map((item) =>
          'actions' in item
            ? {
                ...item,
                actions: item.actions.filter((a) => !searchOnlyIds.has(a.id)),
              }
            : item,
        )
        .filter((item) =>
          'actions' in item
            ? item.actions.length > 0
            : !searchOnlyIds.has(item.id),
        );
    }

    // label matches first, then description/keyword matches; keep group order
    const labelHits: SpotlightActionData[] = [];
    const otherHits: SpotlightActionData[] = [];
    data.forEach((item) => {
      const actions = 'actions' in item ? item.actions : [item];
      const group = 'actions' in item ? item.group : undefined;
      actions.forEach((action) => {
        const tagged = { ...action, group };
        if (normalize(String(action.label ?? '')).includes(query)) {
          labelHits.push(tagged);
        } else if (
          normalize(action.description ?? '').includes(query) ||
          normalize(keywordsText(action.keywords)).includes(query)
        ) {
          otherHits.push(tagged);
        }
      });
    });

    const result: (SpotlightActionData | SpotlightActionGroupData)[] = [];
    const groups = new Map<string, SpotlightActionGroupData>();
    [...labelHits, ...otherHits].forEach(({ group, ...action }) => {
      if (!group) {
        result.push(action);
        return;
      }
      let g = groups.get(group);
      if (!g) {
        g = { group, actions: [] };
        groups.set(group, g);
        result.push(g);
      }
      g.actions.push(action);
    });
    return result;
  };

export const CustomSpotlight = () => {
  const navigate = useNavigate();

  const user = useStore($currUser);
  const permissions = user?.permissions || [];

  const hasPermission = (permission?: string | string[]) => {
    if (!permission) return true;
    if (Array.isArray(permission)) {
      return permission.some((p) => permissions.includes(p));
    }
    return permissions.includes(permission);
  };

  const groups: CustomSpotlightGroupData[] = [
    {
      group: 'Navigacija',
      actions: [
        {
          id: 'home',
          label: 'Domov',
          description: 'Prva stran',
          keywords: ['home', 'zacetek'],
          onClick: () => navigate('/'),
          leftSection: icon(IconHome),
        },
        {
          id: 'events',
          label: 'Dogodki',
          description: 'Koledar dogodkov',
          keywords: ['events', 'koledar', 'calendar'],
          onClick: () => navigate('/events'),
          leftSection: icon(IconCalendarEvent),
        },
        {
          permission: 'CAN_WASH',
          id: 'pranje',
          label: 'Pranje',
          description: 'Dodaj nov termin za pranje',
          keywords: ['wash', 'laundry', 'pralni stroj', 'termin'],
          onClick: () => navigate('/pranje/novo'),
          leftSection: icon(IconWash, 'cyan'),
        },
        {
          permission: 'CAN_WASH',
          id: 'moje-pranje',
          label: 'Moji termini',
          description: 'Pregled rezerviranih terminov za pranje',
          keywords: ['pranje', 'wash', 'laundry', 'rezervacije'],
          onClick: () => navigate('/pranje/moje'),
          leftSection: icon(IconWash, 'cyan'),
        },
        {
          id: 'profile',
          label: 'Moj profil',
          description: 'Preglej svoj profil',
          keywords: ['profile', 'uporabnik', 'racun', 'account'],
          onClick: () => navigate('/user'),
          leftSection: icon(IconUser),
        },
      ],
    },
    {
      // one entry per admin tab, with the same permissions as the tab itself
      group: 'Administracija',
      actions: ADMIN_TABS.map((tab) => ({
        permission: tab.permissions,
        id: `admin-${tab.value}`,
        label: tab.label,
        description: 'Administracija',
        keywords: ['admin', 'upravljanje', 'manage'],
        onClick: () => navigate(`/admin?tab=${tab.value}`),
        leftSection: icon(ADMIN_TAB_ICONS[tab.value] ?? IconList),
      })),
    },
    {
      group: 'Hitra dejanja',
      actions: [
        {
          permission: 'ENROLL',
          searchOnly: true,
          id: 'enroll',
          label: 'Dodaj uporabnika',
          description: 'Vpis novega uporabnika',
          keywords: ['enroll', 'nov uporabnik', 'registracija', 'add user'],
          onClick: () => navigate('/admin/enroll'),
          leftSection: icon(IconUserPlus),
        },
        {
          permission: 'MANAGE_USERS',
          searchOnly: true,
          id: 'edit-users',
          label: 'Urejanje uporabnikov',
          description: 'Uredi podatke in dovoljenja',
          keywords: ['users', 'dovoljenja', 'permissions'],
          onClick: () => navigate('/admin?tab=uporabniki'),
          leftSection: icon(IconUsers),
        },
        {
          permission: 'MANAGE_EVENTS',
          searchOnly: true,
          id: 'events-create',
          label: 'Dodaj dogodek',
          description: 'Ustvari nov dogodek',
          keywords: ['nov dogodek', 'create event'],
          onClick: () => navigate('/events/create'),
          leftSection: icon(IconCalendarPlus),
        },
        {
          permission: 'ADD_OBLJUBA',
          searchOnly: true,
          id: 'promise-create',
          label: 'Dodaj obljubo',
          description: 'Dodaj novo obljubo',
          keywords: ['obljuba', 'promise'],
          onClick: () => navigate('/promises/create'),
          leftSection: icon(IconHeartHandshake),
        },
        {
          permission: 'MANAGE_TRANSACTIONS',
          searchOnly: true,
          id: 'pivo-add',
          label: 'Dodajanje piva',
          description: 'Prodaj pivo stranki',
          keywords: ['pivo', 'prodaja', 'sell', 'beer'],
          onClick: () => navigate('/pivo/add'),
          leftSection: icon(IconBeer),
        },
        {
          permission: 'MANAGE_TRANSACTIONS',
          searchOnly: true,
          id: 'pivo-puf',
          label: 'Seznam pufov',
          description: 'Prikaži seznam pufov',
          keywords: ['puf', 'dolg', 'debt'],
          onClick: () => navigate('/pivo/puf'),
          leftSection: icon(IconList),
        },
        {
          permission: 'MANAGE_TRANSACTIONS',
          searchOnly: true,
          id: 'pivo-transactions',
          label: 'Transakcije',
          description: 'Prikaži vse transakcije',
          keywords: ['transactions', 'plačila'],
          onClick: () => navigate('/pivo/transactions'),
          leftSection: icon(IconTransactionEuro),
        },
        {
          permission: 'MANAGE_TRANSACTIONS',
          searchOnly: true,
          id: 'pivo-items',
          label: 'Ponudba',
          description: 'Urejanje ponudbe piva',
          keywords: ['items', 'cene', 'cenik'],
          onClick: () => navigate('/pivo/items'),
          leftSection: icon(IconBasket),
        },
      ],
    },
  ];

  const searchOnlyIds = new Set<string>();
  const actions: (SpotlightActionData | SpotlightActionGroupData)[] = groups
    .map((g) => ({
      group: g.group,
      // strip our own fields so they don't get spread onto DOM elements
      actions: g.actions
        .filter((a) => hasPermission(a.permission))
        .map(({ permission: _permission, searchOnly, ...a }) => {
          if (searchOnly) searchOnlyIds.add(a.id);
          return a;
        }),
    }))
    .filter((g) => g.actions.length > 0);

  actions.push({
    id: 'logout',
    label: 'Odjava',
    description: 'Odjavi se iz sistema',
    keywords: ['logout', 'sign out'],
    onClick: () => {
      supabaseClient.auth.signOut();
    },
    leftSection: icon(IconLogout, 'red'),
  });

  return (
    <Spotlight
      actions={actions}
      filter={makeFilter(searchOnlyIds)}
      nothingFound="Ni zadetkov..."
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
        placeholder: 'Išči...',
      }}
    />
  );
};
