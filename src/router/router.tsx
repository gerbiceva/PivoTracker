import { Outlet, createBrowserRouter } from "react-router-dom";
import { Authentication } from "./views/Auth";
import { ProtectedPath } from "../components/ProtectedPath";
import App from "./views/Hello";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      // <ProtectedPath redirectUrl="/auth">
        <Outlet />
      // </ProtectedPath>
    ),
    children: [
      {
        path: "/about",
        element: <div>About</div>,
      },
      {
        path: "/",
        element: <App /> ,
      },
    ],
  },

  {
    path: "/auth",
    element: (
      <ProtectedPath
        redirectUrl="/"
        shouldRedirect={(user) => {
          return user != null;
        }}
      >
        <Authentication />
      </ProtectedPath>
    ),
  },
]);
