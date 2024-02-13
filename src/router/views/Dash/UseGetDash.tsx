import useSWR from "swr";
import { Tables } from "../../../supabase/supabase";
import { supabaseClient } from "../../../supabase/supabaseClient";

export const useGetDash = () => {
  const fetcher = () =>
    new Promise<Tables<"total_summary">>((resolve, reject) => {
      supabaseClient
        .from("total_summary")
        .select()
        .then((res) => {
          if (!res.error) {
            resolve(res.data[0]);
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<Tables<"total_summary">>(`/view/nabava/`, fetcher);

  return out;
};
