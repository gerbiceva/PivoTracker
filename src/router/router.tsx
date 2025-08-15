import { createBrowserRouter } from 'react-router-dom';
import { ProtectedPath } from '../components/ProtectedPath';
import { BeerAdded } from '../components/views/Pivo/Adder/Adder';
import App from '../components/views/App';
import { Authentication } from '../components/views/Auth';
import { Dashboard } from '../components/views/Pivo/Dash/Dash';
import { Nabava } from '../components/views/Pivo/Nabava/Nabava';
import { PuffTable } from '../components/views/Pivo/Pufi/PufiTabela';
import { Transactions } from '../components/views/Pivo/Transactions/Transactions';
import { UserView } from '../components/views/Pivo/User/UserOverview';
import { Zaloge } from '../components/views/Zaloge/Zaloge';
import { WashingTimetable } from '../components/views/Washing/Timetable/WashingTimetable';
import { MyWashing } from '../components/views/Washing/MyWashing/MyWashing';

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
        element: <Nabava />,
      },
      {
        path: '/zaloge',
        element: <Zaloge />,
      },
      {
        path: '/pranje',
        element: <WashingTimetable />,
      },
      {
        path: '/moje-pranje',
        element: <MyWashing />,
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
