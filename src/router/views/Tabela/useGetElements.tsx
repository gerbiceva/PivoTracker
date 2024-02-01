import { useState, useEffect } from "react";
import { Tables } from "../../../supabase/supabase";
import { supabaseClient } from "../../../supabase/supabaseClient";

export const useGetElements = () => {
    const [loading, setLoading] = useState(true);
    const [elements, setElements] = useState<Tables<"everything_sum">[]>([]);
    
    useEffect(() => {
        supabaseClient.from("everything_sum").select().then((res) => {
            if (!res.error) {
                setElements(res.data);
            }
            else {
                console.log(res.error);
            }
        }
        ).then(() => setLoading(false));
    }, []);

    return { loading, elements };
};
