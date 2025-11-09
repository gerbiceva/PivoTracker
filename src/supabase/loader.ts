import { notifications } from '@mantine/notifications';
import { supabaseClient } from './supabaseClient';
import { redirect } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export async function protectedPathLoader() {
  const user = await supabaseClient.auth.getUser();
  if (user.error) {
    notifications.show({
      title: user.error.name,
      message: user.error.message,
      color: 'red',
    });
    return null;
  }

  if (!user.data.user) {
    redirect('/auth');
  }
  return null;
}

export const useUser = () => {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? undefined);
        setLoading(false);
      },
    );

    // Initial user fetch
    supabaseClient.auth.getUser().then((user) => {
      setUser(user.data?.user || undefined);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};
