import { createBrowserRouter } from "react-router-dom";
import { Authentication } from "./views/Auth";
import { ProtectedPath } from "../components/ProtectedPath";
import App from "./views/App";
import { Transactions } from "./views/Transactions/Transactions";
import { BeerAdded } from "./views/Adder/Adder";
import { Tab } from "./views/Tabela/Tabela";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: (
      // <ProtectedPath
      // redirectUrl="/"
      // shouldRedirect={(user) => {
      //   return user != null;
      // }}
      // >
      <Authentication />
      //</ProtectedPath>
    ),
  },
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/transactions",
        element: <Transactions />,
      },
      {
        path: "/",
        element: <BeerAdded />,
      },
      {
        path: "/puff",
        element: <Tab />,
      },
    ],
  },
]);
