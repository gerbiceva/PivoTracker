import { useEffect, useState } from 'react';
import { Combobox, InputBase, useCombobox } from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { notifications } from '@mantine/notifications';
import { Tables } from '../../../supabase/supabase';

function getAsyncData(search: string): Promise<Tables<"customers">[]> {
    return new Promise<Tables<"customers">[]>((resolve) => {
        supabaseClient.from('customers').select().ilike('fullname', `%${search.toLowerCase()}%`).then((res) => {
            if (!res.error) {
                resolve(res.data.map((val) => val));
            }
            else {
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

function customerFromId(id:string, customers:Tables<"customers">[]): (Tables<"customers"> | null ){
    return customers.filter((val) => val.id.toString() == id)[0];
}

interface Props {
    value: Tables<"customers"> | null;
    onChange: (value: Tables<"customers"> | null) => void;
}

export const NameCombobox = ({onChange, value}:Props) => {
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    
    // const [value, setValue] = useState<Tables<"customers"> | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useDebouncedState('', 300);
    const [filteredOptions, setFilteredOptions] = useState<Tables<"customers">[]>([]);
    

    useEffect(() => {
        // if value gets cleared, clear search
        if(!value) return setSearch('');
    }, [value]);

    useEffect(() => {
        if(!debouncedSearch) return setFilteredOptions([]);

        // filter non empty string
        getAsyncData(debouncedSearch).then((data) => setFilteredOptions(data));
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
                if(val == "$create") {
                    console.log("create: " + search);
                    supabaseClient.from("customers").insert({fullname: search}).select().then((res) => {
                        if(!res.error) {
                            onChange({fullname: search, id: res.data[0].id});
                            setSearch(search || '');
                        }
                        else {

                        }
                    });
                }
                else {

                    (customerFromId(val, filteredOptions) || null);
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
                <Combobox.Options>
                    {/* {options.length > 0 ? options : <Combobox.Empty>Nothing found</Combobox.Empty>} */}
                    {options}
                    {filteredOptions.length == 0 && search.length > 0 && (
                        <Combobox.Option value="$create">+ Dodaj {search}</Combobox.Option>
                    )}
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
}