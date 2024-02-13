import { useEffect, useState } from "react";
import { supabaseClient } from "../../../supabase/supabaseClient";
import { Tables } from "../../../supabase/supabase";

export const useGetTransactions = (id?: number) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<
    Tables<"named_transactions">[]
  >([]);

  useEffect(() => {
    const query = supabaseClient.from("named_transactions").select();

    if (id) {
      query
        .eq("id", id)
        .order("ordered_at", { ascending: false })
        .then((res) => {
          if (!res.error) {
            setTransactions(res.data);
          } else {
            console.log(res.error);
          }
        })
        .then(() => setLoading(false));
    } else {
      query
        .order("ordered_at", { ascending: false })
        .then((res) => {
          if (!res.error) {
            setTransactions(res.data);
          } else {
            console.log(res.error);
          }
        })
        .then(() => setLoading(false));
    }
  }, [id]);

  return { loading, transactions };
};
