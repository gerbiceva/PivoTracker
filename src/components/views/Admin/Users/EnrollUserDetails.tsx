import { Alert } from '@mantine/core';
import { User } from '@supabase/supabase-js';
import { useState } from 'react';
import { UserEditForm, UserEditFormValues } from '../../../users/UserEditForm';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { IconAlertCircle } from '@tabler/icons-react';

interface EnrollUserDetailsProps {
  newUser: User;
  onSubmit: (values: UserEditFormValues) => void;
}

export const EnrollUserDetails = ({
  newUser,
  onSubmit,
}: EnrollUserDetailsProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleUserSubmit = async (values: UserEditFormValues) => {
    setError(null);
    const { error } = await supabaseClient.from('gerba_user').insert({
      first_name: values.ime,
      surname: values.priimek,
      room: values.stevilkaSobe,
      phone_number: values.telefonska,
      date_of_birth: values.datumRojstva.toISOString(),
      auth_user_id: newUser.id,
    });

    if (error) {
      setError(error.message);
    } else {
      onSubmit(values);
    }
  };

  return (
    <>
      {error && (
        <Alert
          title="Error"
          color="red"
          withCloseButton
          onClose={() => setError(null)}
          my="md"
        >
          {error}
        </Alert>
      )}
      <Alert title="Novi uporabnik" color="teal" my="md">
        <p>
          <b>Email:</b> {newUser.email}
        </p>
        <p>
          <b>ID:</b> {newUser.id}
        </p>
      </Alert>
      <Alert
        withCloseButton
        title="Opozorilo"
        variant="light"
        color="gray"
        my="md"
        icon={<IconAlertCircle />}
      >
        <p>Vnesite podatke o prebivalcu Gerbičeve.</p>
      </Alert>
      <UserEditForm onSubmit={handleUserSubmit} />
    </>
  );
};
