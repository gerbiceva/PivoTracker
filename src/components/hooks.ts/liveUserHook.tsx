// let userTransactions: Tables<""

import { useState } from "react";
import { IUserElements } from "../../router/views/Pufi/Tabela";

export const useLiveUserTransactions = (fullname: string) => {
  const [userTransactions, setUserTransactions] = useState<IUserElements[]>([]);
};
