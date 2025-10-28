import { useEffect, useState } from 'react';
import {
  Combobox,
  InputBase,
  Skeleton,
  useCombobox,
  Text,
  Group,
} from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { notifications } from '@mantine/notifications';
import { userType } from '../../../users/userType';

type customer = userType;

function getAsyncData(search: string): Promise<customer[]> {
  return new Promise<customer[]>((resolve) => {
    supabaseClient
      .from('user_view')
      .select('*')
      .ilike('name', `%${search.toLowerCase()}%`)
      .then((res) => {
        if (!res.error) {
          resolve(res.data);
        } else {
          notifications.show({
            title: 'Error',
            color: 'red',
            message: res.error.message,
          });
          resolve([]);
        }
      });
  });
}

function customerFromId(id: string, customers: customer[]): customer | null {
  return customers.filter((val) => val.base_user_id!.toString() == id)[0];
}

interface Props {
  value: customer | null;
  onChange: (value: customer | null) => void;
}

export const NameCombobox = ({ onChange, value }: Props) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  // const [value, setValue] = useState<Tables<"customers"> | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useDebouncedState('', 300);
  const [filteredOptions, setFilteredOptions] = useState<customer[]>([]);

  useEffect(() => {
    // if value gets cleared, clear search
    if (!value) return setSearch('');
  }, [value]);

  useEffect(() => {
    if (!debouncedSearch) {
      setLoading(false);
      return setFilteredOptions([]);
    }

    // filter non empty string
    getAsyncData(debouncedSearch)
      .then((data) => setFilteredOptions(data))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  const options = filteredOptions.map((item) => (
    <Combobox.Option
      value={item.base_user_id!.toString()}
      key={item.base_user_id}
    >
      {item.name + ' ' + item.surname}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        customerFromId(val, filteredOptions) || null;
        // setValue(customerFromId(val, filteredOptions) || null);
        const newValue = customerFromId(val, filteredOptions);
        onChange(newValue);
        setSearch(newValue?.name || '');
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          label="Išči ime"
          rightSection={<Combobox.Chevron />}
          value={search}
          onChange={(event) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setLoading(true);
            setSearch(event.currentTarget.value);
            setDebouncedSearch(event.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch((value?.name || '') + ' ' + value?.surname);
          }}
          placeholder="Ime priimek"
          rightSectionPointerEvents="none"
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        {loading ? (
          <Combobox.Options p="xs">
            <Skeleton height={8} radius="xl" my="sm" />
            <Skeleton height={8} radius="xl" my="sm" />
          </Combobox.Options>
        ) : (
          <Combobox.Options>
            {options.length > 0 ? (
              options
            ) : filteredOptions.length == 0 && search.length > 0 && !loading ? (
              <Combobox.Option value="$empty">
                <Group>
                  <Text style={{ opacity: 0.4 }}>
                    Uporabnika ni v bazi. Naj se luzer <b>prijavi!</b>
                  </Text>
                </Group>
              </Combobox.Option>
            ) : (
              <Combobox.Empty>Začnite tipkati</Combobox.Empty>
            )}
          </Combobox.Options>
        )}
      </Combobox.Dropdown>
    </Combobox>
  );
};
