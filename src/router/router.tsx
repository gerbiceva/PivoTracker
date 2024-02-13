import { createBrowserRouter } from "react-router-dom";
import { BeerAdded } from "./views/Adder/Adder";
import App from "./views/App";
import { Authentication } from "./views/Auth";
import { PuffTable } from "./views/Pufi/Tabela";
import { Transactions } from "./views/Transactions/Transactions";
import { UserView } from "./views/User/UserOverview";

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
        element: <PuffTable />,
      },
      {
        path: "/user/:id",
        element: <UserView />,
      },
      {
        path: "/*",
        element: "404",
      },
    ],
  },
]);
