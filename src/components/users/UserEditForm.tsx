import { Button, Group, NumberInput, Stack, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';

export interface UserEditFormValues {
  ime: string;
  priimek: string;
  telefonska: string;
  stevilkaSobe: number;
  datumRojstva: Date;
}

interface UserEditFormProps {
  initialState?: UserEditFormValues;
  onSubmit: (values: UserEditFormValues) => void;
}

export const UserEditForm = ({ initialState, onSubmit }: UserEditFormProps) => {
  const form = useForm<UserEditFormValues>({
    mode: 'controlled',
    initialValues: initialState || {
      ime: '',
      priimek: '',
      telefonska: '',
      stevilkaSobe: 0,
      datumRojstva: new Date(),
    },
    validate: {
      ime: (value) => (value.length > 0 ? null : 'Ime je obvezno'),
      priimek: (value) => (value.length > 0 ? null : 'Priimek je obvezen'),
      telefonska: (value) =>
        /^\d{3} \d{3} \d{3}$/.test(value)
          ? null
          : 'Neveljavna telefonska številka (npr. 031 456 789)',
      stevilkaSobe: (value) => (value > 0 ? null : 'Številka sobe je obvezna'),
      datumRojstva: (value) => (value ? null : 'Datum rojstva je obvezen'),
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)} autoComplete="off">
      <Stack maw="70ch" mx="auto">
        <Group w="100%" wrap="nowrap">
          <TextInput
            required
            w="100%"
            label="Ime"
            placeholder="Marsel"
            key={form.key('ime')}
            {...form.getInputProps('ime')}
          />
          <TextInput
            required
            w="100%"
            label="Priimek"
            placeholder="Levstiq"
            key={form.key('priimek')}
            {...form.getInputProps('priimek')}
          />
        </Group>
        <Group w="100%" wrap="nowrap" align="end">
          <TextInput
            description="Telefonska je uporabljena samo za obveščanje o pranju"
            required
            w="100%"
            label="Telefonska"
            placeholder="031 456 789"
            key={form.key('telefonska')}
            {...form.getInputProps('telefonska')}
          />
          <NumberInput
            min={1}
            max={330}
            required
            w="100%"
            label="Številka sobe"
            placeholder="310"
            key={form.key('stevilkaSobe')}
            {...form.getInputProps('stevilkaSobe')}
          />
        </Group>
        <DatePickerInput
          required
          label="Datum rojstva"
          placeholder="6.9.2000"
          key={form.key('datumRojstva')}
          {...form.getInputProps('datumRojstva')}
        />
        <Group justify="flex-end" mt="md">
          <Button type="submit">Submit</Button>
        </Group>
      </Stack>
    </form>
  );
};
