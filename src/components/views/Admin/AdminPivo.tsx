import { Tabs } from '@mantine/core';
import {
  IconBasket,
  IconBeer,
  IconList,
  IconTransactionEuro,
} from '@tabler/icons-react';
import { useStore } from '@nanostores/react';
import { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { $currUser } from '../../../global-state/user';
import { BeerAdder } from '../Pivo/Adder/Adder';
import { PuffTable } from '../Pivo/Pufi/PufiTabela';
import { Transactions } from '../Pivo/Transactions/Transactions';
import { Items } from '../Pivo/Transactions/Items';

interface PivoTab {
  value: string;
  label: string;
  icon: ReactNode;
  permission: string;
  content: ReactNode;
}

const PIVO_TABS: PivoTab[] = [
  {
    value: 'dodajanje',
    label: 'Dodajanje piva',
    icon: <IconBeer size={16} />,
    permission: 'MANAGE_TRANSACTIONS',
    content: <BeerAdder />,
  },
  {
    value: 'pufi',
    label: 'Seznam pufov',
    icon: <IconList size={16} />,
    permission: 'MANAGE_TRANSACTIONS',
    content: <PuffTable />,
  },
  {
    value: 'transakcije',
    label: 'Transakcije',
    icon: <IconTransactionEuro size={16} />,
    permission: 'MANAGE_TRANSACTIONS',
    content: <Transactions />,
  },
  {
    // the items table's RLS only allows writes with MANAGE_ITEMS
    value: 'ponudba',
    label: 'Ponudba',
    icon: <IconBasket size={16} />,
    permission: 'MANAGE_ITEMS',
    content: <Items />,
  },
];

export const AdminPivo = () => {
  const user = useStore($currUser);
  // sub-tab lives in ?pivo= next to the main ?tab=
  const [searchParams, setSearchParams] = useSearchParams();

  const tabs = PIVO_TABS.filter((t) =>
    user?.permissions.includes(t.permission),
  );

  const requested = searchParams.get('pivo');
  const active = tabs.some((t) => t.value === requested)
    ? requested
    : tabs[0]?.value;

  return (
    <Tabs
      variant="pills"
      value={active}
      onChange={(v) => {
        if (!v) return;
        const next = new URLSearchParams(searchParams);
        next.set('pivo', v);
        setSearchParams(next, { replace: true });
      }}
      keepMounted={false}
    >
      <Tabs.List mb="md">
        {tabs.map((t) => (
          <Tabs.Tab key={t.value} value={t.value} leftSection={t.icon}>
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {tabs.map((t) => (
        <Tabs.Panel key={t.value} value={t.value}>
          {t.content}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
};
