import { createBrowserRouter } from 'react-router-dom';
import { ProtectedPath } from '../components/ProtectedPath';
import { BeerAdded } from '../components/views/Adder/Adder';
import App from '../components/views/App';
import { Authentication } from '../components/views/Auth';
import { Dashboard } from '../components/views/Dash/Dash';
import { Zaloge } from '../components/views/Nabava/Zaloge';
import { PuffTable } from '../components/views/Pufi/PufiTabela';
import { Transactions } from '../components/views/Transactions/Transactions';
import { UserView } from '../components/views/User/UserOverview';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Authentication />,
  },
  {
    path: '/',
    element: (
      <ProtectedPath redirectUrl="/auth">
        <App />
      </ProtectedPath>
    ),
    children: [
      {
        path: '/transactions',
        element: <Transactions />,
      },
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/add',
        element: <BeerAdded />,
      },
      {
        path: '/puff',
        element: <PuffTable />,
      },
      {
        path: '/user/:id',
        element: <UserView />,
      },
      {
        path: '/nabava',
        element: <Zaloge />,
      },
      // {
      //   path: '/pdf',
      //   element: (

      //   ),
      // },
      {
        path: '/*',
        element: '404',
      },
    ],
  },
]);
