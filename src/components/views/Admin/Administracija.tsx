import {
  Box,
  Container,
  Group,
  NavLink,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconBasket,
  IconBeer,
  IconCalendarEvent,
  IconHeartHandshake,
  IconList,
  IconShieldCog,
  IconTransactionEuro,
  IconUsers,
} from '@tabler/icons-react';
import { useStore } from '@nanostores/react';
import { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { $currUser } from '../../../global-state/user';
import { Unauthorized } from '../Unauthorized';
import { AdminEvents } from './AdminEvents';
import { ManagePromises } from '../Promises/ManageObljube';
import { UserEditing } from '../UserManagement/UserEditing/UserEditing';
import { AdminPermGroups } from './AdminPermGroups';
import { BeerAdder } from '../Pivo/Adder/Adder';
import { PuffTable } from '../Pivo/Pufi/PufiTabela';
import { Transactions } from '../Pivo/Transactions/Transactions';
import { Items } from '../Pivo/Transactions/Items';
import classes from './Administracija.module.css';

interface AdminTab {
  value: string;
  // menu section the entry is listed under
  group: string;
  label: string;
  icon: ReactNode;
  // shown if the user has any of these
  permissions: string[];
  content: ReactNode;
}

// Same permissions as the standalone routes these pages come from.
export const ADMIN_TABS: AdminTab[] = [
  {
    value: 'dogodki',
    group: 'Dogajanje',
    label: 'Dogodki',
    icon: <IconCalendarEvent size={16} />,
    permissions: ['MANAGE_EVENTS'],
    content: <AdminEvents />,
  },
  {
    value: 'obljube',
    group: 'Dogajanje',
    label: 'Obljube',
    icon: <IconHeartHandshake size={16} />,
    permissions: ['ADD_OBLJUBA'],
    content: <ManagePromises />,
  },
  {
    value: 'prodaja',
    group: 'Pivo',
    label: 'Prodaja piva',
    icon: <IconBeer size={16} />,
    permissions: ['MANAGE_TRANSACTIONS'],
    content: <BeerAdder />,
  },
  {
    value: 'pufi',
    group: 'Pivo',
    label: 'Seznam pufov',
    icon: <IconList size={16} />,
    permissions: ['MANAGE_TRANSACTIONS'],
    content: <PuffTable />,
  },
  {
    value: 'transakcije',
    group: 'Pivo',
    label: 'Transakcije',
    icon: <IconTransactionEuro size={16} />,
    permissions: ['MANAGE_TRANSACTIONS'],
    content: <Transactions />,
  },
  {
    // the items table's RLS only allows writes with MANAGE_ITEMS
    value: 'ponudba',
    group: 'Pivo',
    label: 'Ponudba',
    icon: <IconBasket size={16} />,
    permissions: ['MANAGE_ITEMS'],
    content: <Items />,
  },
  {
    value: 'uporabniki',
    group: 'Ljudje',
    label: 'Uporabniki',
    icon: <IconUsers size={16} />,
    permissions: ['MANAGE_USERS'],
    content: <UserEditing />,
  },
  {
    value: 'vloge',
    group: 'Ljudje',
    label: 'Vloge',
    icon: <IconShieldCog size={16} />,
    permissions: ['MANAGE_GROUPS'],
    content: <AdminPermGroups />,
  },
];

// old ?tab=pivo&pivo=… links from before Pivo's sub-tabs moved into the menu
const LEGACY_PIVO: Record<string, string> = {
  dodajanje: 'prodaja',
  pufi: 'pufi',
  transakcije: 'transakcije',
  ponudba: 'ponudba',
};

export const ADMIN_PERMISSIONS = ADMIN_TABS.flatMap((t) => t.permissions);

export const Administracija = () => {
  const user = useStore($currUser);
  // active tab lives in ?tab= so it survives reloads and can be linked to
  const [searchParams, setSearchParams] = useSearchParams();

  const tabs = ADMIN_TABS.filter((t) =>
    t.permissions.some((p) => user?.permissions.includes(p)),
  );

  if (user && tabs.length === 0) {
    return <Unauthorized />;
  }

  const requested =
    searchParams.get('tab') === 'pivo'
      ? (LEGACY_PIVO[searchParams.get('pivo') ?? ''] ?? 'prodaja')
      : searchParams.get('tab');
  const active =
    tabs.find((t) => t.value === requested) ??
    (tabs[0] as AdminTab | undefined);
  const select = (value: string) =>
    setSearchParams({ tab: value }, { replace: true });
  const groups = [...new Set(tabs.map((t) => t.group))];

  return (
    <Container size="xl">
      <Title order={1} mb="lg">
        Administracija
      </Title>
      <Group align="flex-start" gap="xl" wrap="nowrap">
        <Stack gap={4} w={220} visibleFrom="sm">
          {groups.map((g) => (
            <Stack key={g} gap={2} mb="sm">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="sm">
                {g}
              </Text>
              {tabs
                .filter((t) => t.group === g)
                .map((t) => (
                  <NavLink
                    key={t.value}
                    label={t.label}
                    leftSection={t.icon}
                    active={t.value === active?.value}
                    onClick={() => select(t.value)}
                    variant="light"
                    style={{ borderRadius: 'var(--mantine-radius-sm)' }}
                  />
                ))}
            </Stack>
          ))}
        </Stack>

        <Stack flex={1} miw={0}>
          {/* phones: the menu becomes a picker above the page */}
          <Stack hiddenFrom="sm" gap="xs">
            <Select
              aria-label="Stran"
              data={groups.map((g) => ({
                group: g,
                items: tabs
                  .filter((t) => t.group === g)
                  .map((t) => ({ value: t.value, label: t.label })),
              }))}
              value={active?.value ?? null}
              onChange={(v) => v && select(v)}
              allowDeselect={false}
            />
          </Stack>
          <Box className={classes.content}>{active?.content}</Box>
        </Stack>
      </Group>
    </Container>
  );
};
