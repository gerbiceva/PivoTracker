import { useEffect, useState } from "react";
import { supabaseClient } from "../../../supabase/supabaseClient";
import { Tables } from "../../../supabase/supabase";

export const useGetTransactions = () => {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Tables<"named_transactions">[]>([]);
    
    useEffect(() => {
        supabaseClient.from("named_transactions").select().order('ordered_at', { ascending: false }).then((res) => {
            if (!res.error) {
                setTransactions(res.data);
            }
            else {
                console.log(res.error);
            }
        }
        ).then(() => setLoading(false));
    }, []);

    return { loading, transactions };
};
