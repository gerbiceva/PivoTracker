import { getSupaWR } from '../../supabase/supa-utils/supaSWR';
import { supabaseClient } from '../../supabase/supabaseClient';

export const usePermissionsForUser = (userID: number) => {
  return getSupaWR({
    query: () =>
      supabaseClient
        .from('user_permissions_view')
        .select('*')
        .filter('user_id', 'eq', userID),
    table: ['permissions', 'permission_types'],
    params: [userID],
  });
};
