import { Tables } from "../../../supabase/supabase";
import { supabaseClient } from "../../../supabase/supabaseClient";
import useSWR from "swr";

export const useGetUserInfo = (id: number) => {
  const fetcher = () =>
    new Promise<Tables<"customers">>((resolve, reject) => {
      supabaseClient
        .from("customers")
        .select()
        .eq("id", id)
        .order("id", { ascending: false })
        .then((res) => {
          if (!res.error) {
            if (res.data.length == 1) {
              resolve(res.data[0]);
            } else {
              reject(Error("No customer foudnd"));
            }
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<Tables<"customers">>(`/view/customers/${id}`, fetcher);

  return out;
};
