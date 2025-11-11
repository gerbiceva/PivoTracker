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
import { useUser } from '../../../supabase/loader';
import { Database } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';

interface PromiseFormValues {
  user: Database['public']['Views']['user_view']['Row'] | null;
  amount: number;
  description: string;
}

export const AddPromise = () => {
  const { loading: loadingMinister, user: minister } = useUser();
  const navigate = useNavigate();

  const form = useForm<PromiseFormValues>({
    initialValues: {
      user: null,
      amount: 1,
      description: '',
    },
    validate: {
      user: (value) => (value ? null : 'Please select a user'),
      amount: (value) =>
        value > 0 ? null : 'Amount of beer must be greater than 0',
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: PromiseFormValues) => {
    if (!values.user || !minister || !values.user.base_user_id) {
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
        .from('promises') // Assuming a 'promises' table exists in your database
        .insert({
          user_id: values.user.base_user_id,
          minister_id: minister.id,
          amount: values.amount,
          description: values.description,
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
                navigate(`/promises/user/${values.user?.base_user_id}`); // Assuming a route for viewing user promises
              }}
            >
              View User Promises
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
            label="Description/Notes"
            placeholder="e.g., Promised 5 beers for helping with the event."
            minRows={3}
            {...form.getInputProps('description')}
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
          visible={isLoading || loadingMinister}
          overlayProps={{ radius: 'sm', blur: 2 }}
        />
      </Center>
    </form>
  );
};
