import { createBrowserRouter } from 'react-router-dom';
import { ProtectedPath } from '../components/ProtectedPath';
import { BeerAdded } from '../components/views/Pivo/Adder/Adder';
import App from '../components/views/App';
import { Authentication } from '../components/views/Auth';
import { Dashboard } from '../components/views/Pivo/Dash/Dash';
import { PuffTable } from '../components/views/Pivo/Pufi/PufiTabela';
import { Transactions } from '../components/views/Pivo/Transactions/Transactions';
import { UserView } from '../components/views/Pivo/User/UserOverview';
import { WashingTimetable } from '../components/views/Washing/Timetable/WashingTimetable';
import { MyWashing } from '../components/views/Washing/MyWashing/MyWashing';
import { EnrollUser } from '../components/views/Admin/Users/Enroll';
import { EditSelf } from '../components/views/UserManagement/ViewSelf';
import { EditUsers } from '../components/views/UserManagement/ViewUsers';

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
        path: '/user',
        element: <EditSelf />,
      },
      {
        path: '/users',
        element: <EditUsers />,
      },
      // {
      //   path: '/nabava',
      //   element: <Nabava />,
      // },
      // {
      //   path: '/zaloge',
      //   element: <Zaloge />,
      // },
      {
        path: '/pranje',
        element: <WashingTimetable />,
      },
      {
        path: '/moje-pranje',
        element: <MyWashing />,
      },
      {
        path: '/admin/enroll',
        element: <EnrollUser />,
      },

      {
        path: '/*',
        element: '404',
      },
    ],
  },
]);
