import { atom } from 'nanostores';
import { supabaseClient } from '../supabase/supabaseClient';
import { Database } from '../supabase/supabase';

export type FullUser =
  Database['public']['Functions']['get_user_full_details']['Returns'][0];

export const $currUser = atom<FullUser | null>(null);

supabaseClient.auth.onAuthStateChange((authChangeEvent, _) => {
  if (authChangeEvent != 'SIGNED_OUT') {
    supabaseClient.rpc('get_user_full_details').then((res) => {
      if (res.error) {
        console.error(res.error);
        return;
      }

      if (res.data) {
        $currUser.set(res.data[0] || null);
        // if (authChangeEvent == 'SIGNED_IN') {
        // notifications.show({
        //   title: 'Prijavljen',
        //   message: `User ${res.data[0].auth_email}`,
        //   color: 'blue',
        // });
        // }
      }
    });
  }
});
