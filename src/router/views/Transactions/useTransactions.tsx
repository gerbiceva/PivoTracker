import { supabaseClient } from "../../../supabase/supabaseClient";
import { Tables } from "../../../supabase/supabase";
import useSWR from "swr";

export const useGetTransactions = (id?: number) => {
  const fetcher = () =>
    new Promise<Tables<"named_transactions">[]>((resolve, reject) => {
      const query = supabaseClient.from("named_transactions").select();

      if (id) {
        query
          .eq("id", id)
          .order("ordered_at", { ascending: false })
          .then((res) => {
            if (!res.error) {
              resolve(res.data);
            } else {
              reject(res.error);
            }
          });
      } else {
        query.order("ordered_at", { ascending: false }).then((res) => {
          if (!res.error) {
            resolve(res.data);
          } else {
            reject(res.error);
          }
        });
      }
    });

  const out = useSWR<Tables<"named_transactions">[]>(
    `/view/named_transactions`,
    fetcher
  );

  return out;
};
