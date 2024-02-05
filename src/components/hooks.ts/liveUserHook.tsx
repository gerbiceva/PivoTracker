

// let userTransactions: Tables<""

import { useState } from "react";
import { IUserElements } from "../../router/views/Tabela/Tabela";

export const useLiveUserTransactions = (fullname: string) => {
    const [userTransactions, setUserTransactions] = useState<IUserElements[]>([]);
};