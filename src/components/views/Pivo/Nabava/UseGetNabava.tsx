import useSWR from 'swr';
import { Tables } from '../../../../supabase/supabase';
import { supabaseClient } from '../../../../supabase/supabaseClient';
import { useState } from 'react';

export const useGetNabava = () => {
  const fetcher = () =>
    new Promise<Tables<'gerba_storage'>[]>((resolve, reject) => {
      supabaseClient
        .from('gerba_storage')
        .select()
        .order('created_at', { ascending: false })
        .then((res) => {
          if (!res.error) {
            resolve(res.data);
          } else {
            reject(res.error);
          }
        });
    });

  const out = useSWR<Tables<'gerba_storage'>[]>(
    `/view/global_storage/`,
    fetcher,
  );

  return out;
};

export type nabava = Omit<
  Tables<'gerba_storage'>,
  'minister' | 'id' | 'created_at'
>;

export const useAddNabava = () => {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mutate = useGetNabava().mutate;
  const add = (nabava: nabava) => {
    setIsLoading(true);
    setIsError(false);
    return new Promise<void>((resolve, reject) => {
      supabaseClient
        .from('gerba_storage')
        .insert({
          notes: nabava.notes,
          price: nabava.price,
          beer_count: nabava.beer_count,
        })
        .select()
        .then((res) => {
          if (!res.error) {
            mutate();
            resolve();
          } else {
            setIsError(true);
            reject(res.error);
          }

          setIsLoading(false);
        });
    });
  };

  return { isError, isLoading, add };
};
