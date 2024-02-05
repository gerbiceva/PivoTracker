import { useEffect, useState } from "react";
import { Tables } from "../../supabase/supabase";
import { PostgrestError } from "@supabase/supabase-js";
import { supabaseClient } from "../../supabase/supabaseClient";
import { notifications } from "@mantine/notifications";

let transactionsBuffer: Tables<"named_transactions">[] = [];
export const useLiveTransactions = () => {
  const [transactions, setTransactions] = useState<
    Tables<"named_transactions">[]
  >([]);
  const [err, setErr] = useState<Error | PostgrestError>();
  const [isLoading, setLoading] = useState(true);

  const removeTransaction = (id: number) => {
    setTransactions(transactions.filter((val) => val.id !== id));
    supabaseClient
      .from("transactions")
      .delete()
      .eq("id", id)
      .then((res) => {
        if (res.error) {
          setErr(res.error);
          notifications.show({
            title: "Napaka",
            color: "red",
            message: `Napaka pri brisanju transakcije: ${res.error.message}!`,
          });
        } else {
          notifications.show({
            title: "Uspeh",
            color: "green",
            message: "Transakcija uspešno izbrisana!",
          });
        }
      });
  };

  useEffect(() => {
    supabaseClient
      .channel("schema-db-changes")
      //   .on<Tables<"named_transactions">>(
      //     "postgres_changes",
      //     {
      //       event: "UPDATE",
      //       schema: "public",
      //     },
      //     (payload) => {
      //       if (payload.errors) {
      //         setErr(new Error(payload.errors[0]));
      //         setZelje([]);
      //         return;
      //       }
      //       // find old index
      //       for (let i = 0; i < zeljeBuffer.length; i++) {
      //         if (zeljeBuffer[i].id == payload.old.id) {
      //           zeljeBuffer[i].clicks = payload.new.clicks;
      //         }
      //       }
      //       setZelje([...zeljeBuffer]);
      //     }
      //   )
      .on<Tables<"named_transactions">>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
        },
        (payload) => {
          console.log({ payload });

          if (payload.errors) {
            setErr(new Error(payload.errors[0]));
            // zeljeBuffer = [];
            return;
          }

          if (payload.new) {
            setTransactions([payload.new, ...transactionsBuffer]);
          }
        }
      )
      .on<Tables<"named_transactions">>(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
        },
        (payload) => {
          if (payload.errors) {
            setErr(new Error(payload.errors[0]));
            setTransactions([]);
            return;
          }
          setTransactions(
            transactionsBuffer.filter(
              (transaction) => transaction.id != payload.old.id
            )
          );
        }
      )
      .subscribe((state) => {
        console.log(state);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    supabaseClient
      .from("named_transactions")
      .select()
      .order("ordered_at", { ascending: false })
      .then((resp) => {
        if (resp.error) {
          setErr(resp.error);
        } else if (resp.data) {
          setTransactions(resp.data);
          transactionsBuffer = resp.data;
        }
        setLoading(false);
      });
  }, []);

  return {
    transactions,
    isLoading,
    err,
    removeTransaction,
  };
};
