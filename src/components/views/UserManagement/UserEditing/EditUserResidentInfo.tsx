import {
  Stack,
  Paper,
  Title,
  LoadingOverlay,
  Alert,
  Switch,
} from '@mantine/core';
import { getSupaWR } from '../../../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { useEffect, useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';
import { ResidentInfoForm } from './ResidentInfoForm';

export const EditUserResidentInfo = ({ userId }: { userId: number }) => {
  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = getSupaWR({
    query: () =>
      supabaseClient.from('base_users').select('*').eq('id', userId).single(),
    table: 'base_users',
    params: [userId],
  });

  const [isResident, setIsResident] = useState(false);

  useEffect(() => {
    if (user) {
      setIsResident(!!user.resident);
    }
  }, [user]);

  const handleToggleIsResident = async () => {
    if (!userId) return;

    if (isResident) {
      // Remove resident link
      await supabaseClient
        .from('base_users')
        .update({ resident: null })
        .eq('id', userId);
    } else {
      // Create new resident and link to user
      const { data } = await supabaseClient
        .from('residents')
        .insert({ room: 0 })
        .select()
        .single();
      if (data) {
        await supabaseClient
          .from('base_users')
          .update({ resident: data.id })
          .eq('id', userId);
      }
    }
    mutate();
  };

  if (error) {
    return (
      <Alert title="Error loading user data" icon={<IconAlertCircle />}>
        {error.message}
      </Alert>
    );
  }

  return (
    <Paper withBorder p="md" style={{ position: 'relative' }}>
      <LoadingOverlay visible={isLoading} />
      <Stack>
        <Title order={3}>Resident Information</Title>
        <Switch
          label="Is resident"
          checked={isResident}
          onChange={handleToggleIsResident}
        />
        {user?.resident && <ResidentInfoForm residentId={user.resident} />}
      </Stack>
    </Paper>
  );
};
