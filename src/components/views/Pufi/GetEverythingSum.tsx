import { Tables } from "../../../supabase/supabase";
import { supabaseClient } from "../../../supabase/supabaseClient";
import useSWR from "swr";
import { pivoVGajba } from "../../../utils/Converter";

interface EverythingSumWithOwe extends Tables<"everything_sum"> {
  owed: number;
}

const getElementsParsed = (
  elements: Tables<"everything_sum">[]
): EverythingSumWithOwe[] => {
  const out: EverythingSumWithOwe[] = elements
    .map((val) => ({
      ...val, // destructure the thing before
      owed: pivoVGajba(val.total_ordered || 0, val.total_paid || 0 / 10),
    }))
    .sort((a, b) => b.owed - a.owed);

  return out;
};

export const useGetSummedDebt = () => {
  const fetcher = () =>
    new Promise<EverythingSumWithOwe[]>((resolve, reject) => {
      supabaseClient
        .from("everything_sum")
        .select()
        .order("total_ordered", { ascending: false })
        .then((res) => {
          if (!res.error) {
            resolve(getElementsParsed(res.data));
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<EverythingSumWithOwe[]>(`/view/everything_sum`, fetcher);

  return out;
};