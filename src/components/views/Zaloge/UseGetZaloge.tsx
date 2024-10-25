import useSWR from 'swr';
import { Tables } from '../../../supabase/supabase';
import { supabaseClient } from '../../../supabase/supabaseClient';
import { useState } from 'react';

export const useGetZaloge = () => {
  const fetcher = () =>
    new Promise<Tables<'named_minister_transactions'>[]>((resolve, reject) => {
      supabaseClient
        .from('named_minister_transactions')
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

  const out = useSWR<Tables<'named_minister_transactions'>[]>(
    `/view/minister_storage_transactions/`,
    fetcher,
  );

  return out;
};

export type nabava = Omit<
  Tables<'minister_storage_transactions'>,
  'id' | 'created_at'
>;

export const useRestockMinister = () => {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mutate = useGetZaloge().mutate;
  const add = (nabava: nabava) => {
    setIsLoading(true);
    setIsError(false);
    return new Promise<void>((resolve, reject) => {
      supabaseClient
        .from('gerba_storage')
        .insert({
          price: nabava.beer_count,
          beer_count: nabava.beer_count,
          minister: nabava.to_minister,
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
