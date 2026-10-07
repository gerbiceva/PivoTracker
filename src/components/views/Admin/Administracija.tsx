import { Container, Stack, Tabs, Title } from '@mantine/core';
import {
  IconBeer,
  IconCalendarEvent,
  IconHeartHandshake,
  IconShieldCog,
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
import { AdminPivo } from './AdminPivo';
import { AdminPermGroups } from './AdminPermGroups';

interface AdminTab {
  value: string;
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
    label: 'Dogodki',
    icon: <IconCalendarEvent size={16} />,
    permissions: ['MANAGE_EVENTS'],
    content: <AdminEvents />,
  },
  {
    value: 'obljube',
    label: 'Obljube',
    icon: <IconHeartHandshake size={16} />,
    permissions: ['ADD_OBLJUBA'],
    content: <ManagePromises />,
  },
  {
    value: 'uporabniki',
    label: 'Uporabniki',
    icon: <IconUsers size={16} />,
    permissions: ['MANAGE_USERS'],
    content: <UserEditing />,
  },
  {
    value: 'pivo',
    label: 'Pivo',
    icon: <IconBeer size={16} />,
    permissions: ['MANAGE_TRANSACTIONS', 'MANAGE_ITEMS'],
    content: <AdminPivo />,
  },
  {
    value: 'vloge',
    label: 'Vloge',
    icon: <IconShieldCog size={16} />,
    permissions: ['MANAGE_GROUPS'],
    content: <AdminPermGroups />,
  },
];

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

  const requested = searchParams.get('tab');
  const active = tabs.some((t) => t.value === requested)
    ? requested
    : tabs[0]?.value;

  return (
    <Container size="xl">
      <Stack>
        <Title>Administracija</Title>
        <Tabs
          value={active}
          // switching main tab drops sub-tab params like ?pivo=
          onChange={(v) => v && setSearchParams({ tab: v }, { replace: true })}
          keepMounted={false}
        >
          <Tabs.List>
            {tabs.map((t) => (
              <Tabs.Tab key={t.value} value={t.value} leftSection={t.icon}>
                {t.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {tabs.map((t) => (
            <Tabs.Panel key={t.value} value={t.value} pt="md">
              {t.content}
            </Tabs.Panel>
          ))}
        </Tabs>
      </Stack>
    </Container>
  );
};
