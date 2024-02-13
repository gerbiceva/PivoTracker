import { createBrowserRouter } from "react-router-dom";
import { BeerAdded } from "./views/Adder/Adder";
import App from "./views/App";
import { Authentication } from "./views/Auth";
import { PuffTable } from "./views/Pufi/PufiTabela";
import { Transactions } from "./views/Transactions/Transactions";
import { UserView } from "./views/User/UserOverview";
import { Nabava } from "./views/Nabava/Nabava";
import { ProtectedPath } from "../components/ProtectedPath";
import { Dashboard } from "./views/Dash/Dash";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Authentication />,
  },
  {
    path: "/",
    element: (
      <ProtectedPath redirectUrl="/auth">
        <App />
      </ProtectedPath>
    ),
    children: [
      {
        path: "/transactions",
        element: <Transactions />,
      },
      {
        path: "/",
        element: <Dashboard />,
      },
      {
        path: "/add",
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
        path: "/nabava",
        element: <Nabava />,
      },
      {
        path: "/*",
        element: "404",
      },
    ],
  },
]);
