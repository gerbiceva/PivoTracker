import { Tables } from "../../../supabase/supabase";
import { supabaseClient } from "../../../supabase/supabaseClient";
import useSWR from "swr";

export const useGetSummedDebt = () => {
  const fetcher = () =>
    new Promise<Tables<"everything_sum">[]>((resolve, reject) => {
      supabaseClient
        .from("everything_sum")
        .select()
        .order("total_ordered", { ascending: false })
        .then((res) => {
          if (!res.error) {
            resolve(res.data);
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<Tables<"everything_sum">[]>(
    `/view/everything_sum`,
    fetcher
  );

  return out;
};
