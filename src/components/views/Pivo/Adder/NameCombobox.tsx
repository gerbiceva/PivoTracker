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
import { baseUserToString } from '../../../../utils/userUtils';

type customer = userType;

function getAsyncData(search: string): Promise<customer[]> {
  return new Promise<customer[]>((resolve) => {
    const searchTerms = search
      .toLowerCase()
      .split(' ')
      .filter((term) => term.trim() !== '');

    let query = supabaseClient.from('user_view').select('*');

    if (searchTerms.length > 0) {
      searchTerms.forEach((term) => {
        query = query
          .or(`name.ilike.%${term}%,surname.ilike.%${term}%`)
          .limit(6);
      });
    } else {
      resolve([]);
      return;
    }

    query.then((res) => {
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
      value={(item.base_user_id || 1).toString()}
      key={item.base_user_id}
    >
      {baseUserToString(item)}
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
        setSearch(baseUserToString(newValue as customer));
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
            setSearch(baseUserToString(value as customer));
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
