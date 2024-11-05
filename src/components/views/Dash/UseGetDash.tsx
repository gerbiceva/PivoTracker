import useSWR from 'swr';
import { supabaseClient } from '../../../supabase/supabaseClient';

export type dashData = {
  total_ordered: number;
  total_paid: number;
  total_value: number;
  total_debt: number;
  total_beer_count: number;
};

export const useGetTotalSummary = (datefrom: Date, dateTo: Date) => {
  const fetcher = () =>
    new Promise<dashData>((resolve, reject) => {
      supabaseClient
        .rpc('get_total_summary', {
          datefrom: datefrom.toUTCString(),
          dateto: dateTo.toUTCString(),
        })
        .then((res) => {
          if (!res.error) {
            resolve(res.data[0]);
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<dashData>(`/view/nabava/${datefrom}/${dateTo}`, fetcher);

  return out;
};
