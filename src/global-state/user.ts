import { User } from '@supabase/supabase-js';
import { atom } from 'nanostores';
import { supabaseClient } from '../supabase/supabaseClient';
import { notifications } from '@mantine/notifications';

export const $currUser = atom<User | null>(null);

supabaseClient.auth.onAuthStateChange((authChangeEvent, session) => {
  $currUser.set(session?.user || null);
  if (authChangeEvent == 'SIGNED_IN') {
    notifications.show({
      title: 'Prijavljen',
      message: `User ${session?.user.id}`,
      color: 'blue',
    });
  }
});
