import { User } from "@supabase/supabase-js";
import { atom } from "nanostores";
import { supabaseClient } from "../supabase/supabaseClient";

export const $currUser = atom<User | null>(null);

supabaseClient.auth.onAuthStateChange((authChangeEvent, session) => {
  $currUser.set(session?.user || null);
});
