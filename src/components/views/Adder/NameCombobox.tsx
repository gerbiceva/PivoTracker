import { useEffect, useState } from 'react';
import { Combobox, InputBase, Skeleton, useCombobox } from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { notifications, showNotification } from '@mantine/notifications';
import { Tables } from '../../../supabase/supabase';

function getAsyncData(search: string): Promise<Tables<'customers'>[]> {
  return new Promise<Tables<'customers'>[]>((resolve) => {
    supabaseClient
      .from('customers')
      .select()
      .ilike('fullname', `%${search.toLowerCase()}%`)
      .then((res) => {
        if (!res.error) {
          resolve(res.data.map((val) => val));
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

function customerFromId(
  id: string,
  customers: Tables<'customers'>[],
): Tables<'customers'> | null {
  return customers.filter((val) => val.id.toString() == id)[0];
}

interface Props {
  value: Tables<'customers'> | null;
  onChange: (value: Tables<'customers'> | null) => void;
}

export const NameCombobox = ({ onChange, value }: Props) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  // const [value, setValue] = useState<Tables<"customers"> | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useDebouncedState('', 300);
  const [filteredOptions, setFilteredOptions] = useState<Tables<'customers'>[]>(
    [],
  );

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
    <Combobox.Option value={item.id.toString()} key={item.id}>
      {item.fullname}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        if (val == '$create') {
          //   console.log("create: " + search);
          supabaseClient
            .from('customers')
            .insert({ fullname: search })
            .select()
            .then((res) => {
              if (!res.error) {
                onChange({
                  created_at: null,
                  user_link: res.data[0].user_link,
                  fullname: res.data[0].fullname,
                  id: res.data[0].id,
                });
                setSearch(res.data[0].fullname || '');
              } else {
                showNotification({
                  color: 'red',
                  title: 'Error',
                  message: `Error: ${res.error.message}`,
                });
                setSearch('');
                onChange(null);
              }
            });
        } else {
          customerFromId(val, filteredOptions) || null;
          // setValue(customerFromId(val, filteredOptions) || null);
          const newValue = customerFromId(val, filteredOptions);
          onChange(newValue);
          setSearch(newValue?.fullname || '');
        }
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
            setSearch(value?.fullname || '');
          }}
          placeholder="Bilen Tetner"
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
              <Combobox.Option value="$create">
                + Dodaj {search}
              </Combobox.Option>
            ) : (
              <Combobox.Empty>Začnite tipkati</Combobox.Empty>
            )}
            {options}
          </Combobox.Options>
        )}
      </Combobox.Dropdown>
    </Combobox>
  );
};
