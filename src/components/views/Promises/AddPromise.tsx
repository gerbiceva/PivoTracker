import {
  Button,
  LoadingOverlay,
  NumberInput,
  Stack,
  Textarea,
  Title,
  Center,
  Text,
  Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { NameCombobox } from '../Pivo/Adder/NameCombobox';
import { Database } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { useStore } from '@nanostores/react';
import { $currUser } from '../../../global-state/user';

interface PromiseFormValues {
  user: Database['public']['Views']['user_view']['Row'] | null;
  amount: number;
  reason: string;
}

export const AddPromise = () => {
  const user = useStore($currUser);
  const navigate = useNavigate();

  const form = useForm<PromiseFormValues>({
    initialValues: {
      user: null,
      amount: 1,
      reason: '',
    },
    validate: {
      user: (value) => (value ? null : 'Please select a user'),
      amount: (value) =>
        value > 0 ? null : 'Amount of beer must be greater than 0',
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: PromiseFormValues) => {
    if (!values.user || !user || !values.user.base_user_id) {
      notifications.show({
        title: 'Error',
        color: 'red',
        message: 'User or minister information is missing.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabaseClient
        .from('obljube') // Using 'obljube' table
        .insert({
          who: values.user.base_user_id,
          minister: user.base_user_id,
          amount: values.amount,
          reason: values.reason,
        });

      if (error) {
        throw error;
      }

      notifications.show({
        title: 'Success',
        color: 'green',
        message: (
          <Stack>
            <Text>Promise successfully added!</Text>
            <Button
              onClick={() => {
                navigate(`/promises/manage`); // Navigate to the manage promises page
              }}
            >
              Manage Promises
            </Button>
          </Stack>
        ),
      });
      form.reset();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        color: 'red',
        message: `Failed to add promise: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Center w="100%" h="100%">
        <Stack w="100%" mx="auto">
          <Title order={1}>Add New Promise</Title>

          <NameCombobox
            value={form.getInputProps('user').value}
            onChange={form.getInputProps('user').onChange}
          />

          <NumberInput
            label="Beer Amount"
            placeholder="e.g., 5"
            min={1}
            {...form.getInputProps('amount')}
          />

          <Textarea
            label="Reason/Notes"
            placeholder="e.g., Promised 5 beers for helping with the event."
            minRows={3}
            {...form.getInputProps('reason')}
          />

          <Box ml="auto">
            <Button
              my="xl"
              size="md"
              fullWidth
              type="submit"
              disabled={form.values.user == null || !form.isValid()}
            >
              Add Promise
            </Button>
          </Box>
        </Stack>
        <LoadingOverlay
          visible={isLoading}
          overlayProps={{ radius: 'sm', blur: 2 }}
        />
      </Center>
    </form>
  );
};
