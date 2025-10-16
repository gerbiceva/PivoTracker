import { Alert, Box, Button, Chip, Group, Stack } from '@mantine/core';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { UserEditFormValues } from '../../../users/UserEditForm';
import { IconAlertCircle } from '@tabler/icons-react';

interface LinkCustomerProps {
  newUser: User;
  userDetails: UserEditFormValues;
  onSubmit: (customer?: Customer) => void;
}

interface Customer {
  id: number;
  fullname: string;
  user_link: string | null;
}

export const LinkCustomer = ({
  newUser,
  userDetails,
  onSubmit,
}: LinkCustomerProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!userDetails) return;
      setLoading(true);
      setError(null);
      const searchTokens = `${userDetails.ime} ${userDetails.priimek}`
        .toLowerCase()
        .split(' ')
        .filter(Boolean);
      const orFilter = searchTokens
        .map((token) => `fullname.ilike.%${token}%`)
        .join(',');

      const { data, error } = await supabaseClient
        .from('customers')
        .select('id, fullname, user_link')
        .or(orFilter);

      if (error) {
        setError(error.message);
      } else {
        setCustomers(data || []);
      }
      setLoading(false);
    };

    fetchCustomers();
  }, [userDetails]);

  const handleLinkCustomer = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    setError(null);
    const { error } = await supabaseClient
      .from('customers')
      .update({ user_link: newUser.id })
      .eq('id', selectedCustomer);

    if (error) {
      setError(error.message);
    } else {
      const linkedCustomer = customers.find((c) => c.id === selectedCustomer);
      onSubmit(linkedCustomer);
    }
    setLoading(false);
  };

  return (
    <Stack>
      <Alert
        title="Opozorilo"
        variant="light"
        color="gray"
        my="md"
        icon={<IconAlertCircle />}
      >
        <p>
          Če je uporabnik kdaj prej kupoval pivo ima že ustvarjen račun stranke.
        </p>
        <p>Označite račun stranke, da ga povežete</p>
      </Alert>

      {error && (
        <Alert
          title="Error"
          color="red"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Box maw="70ch" mx="auto" my="xl">
        <Chip.Group
          value={selectedCustomer?.toString()}
          onChange={(value) => setSelectedCustomer(Number(value))}
        >
          <Group justify="center">
            {customers.map((customer) => (
              <Chip
                key={customer.id}
                value={customer.id.toString()}
                disabled={!!customer.user_link}
              >
                {customer.fullname}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Box>

      <Group justify="flex-end">
        <Button
          onClick={handleLinkCustomer}
          disabled={!selectedCustomer || loading}
        >
          Poveži in nadaljuj
        </Button>
        <Button variant="subtle" onClick={() => onSubmit()}>
          Preskoči
        </Button>
      </Group>
    </Stack>
  );
};
