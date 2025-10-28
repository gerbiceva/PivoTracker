import { Database } from '../../supabase/supabase';

export type userType = Database['public']['Views']['user_view']['Row'];
