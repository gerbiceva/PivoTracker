import { createBrowserRouter, Outlet } from 'react-router-dom';
import { ProtectedPath } from '../components/ProtectedPath';
import { PermissionPath } from '../components/PermissionPath';
import { Unauthorized } from '../components/views/Unauthorized';
import { BeerAdded } from '../components/views/Pivo/Adder/Adder';
import App from '../components/views/App';
import { Authentication } from '../components/views/auth/Auth';
import { Dashboard } from '../components/views/Pivo/Dash/Dash';
import { PuffTable } from '../components/views/Pivo/Pufi/PufiTabela';
import { Transactions } from '../components/views/Pivo/Transactions/Transactions';
import { UserView } from '../components/views/Pivo/User/UserOverview';
import { WashingTimetable } from '../components/views/Washing/Timetable/WashingTimetable';
import { MyWashing } from '../components/views/Washing/MyWashing/MyWashing';
import { EnrollUser } from '../components/views/Admin/Users/Enroll';
import { EditSelf } from '../components/views/UserManagement/ViewSelf';
import { PranjeInfo } from '../components/views/Washing/Info/PranjeInfo';
import { UserEditing } from '../components/views/UserManagement/UserEditing/UserEditing';
import { EditUserPage } from '../components/views/UserManagement/UserEditing/EditUserPage';
import { Title } from '@mantine/core';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,

    children: [
      // HOME
      {
        path: '/',
        element: <Title>Domov - dom - kuča</Title>,
      },

      // PIVO
      {
        path: '/pivo',
        element: (
          <ProtectedPath redirectUrl="/auth">
            <Outlet />
          </ProtectedPath>
        ),
        children: [
          {
            path: '/pivo/transactions',
            element: (
              <PermissionPath permission="MANAGE_TRANSACTIONS">
                <Transactions />
              </PermissionPath>
            ),
          },
          {
            path: '/pivo/',
            element: (
              <PermissionPath permission="MANAGE_TRANSACTIONS">
                <Dashboard />
              </PermissionPath>
            ),
          },

          {
            path: '/pivo/add',
            element: (
              <PermissionPath permission="MANAGE_TRANSACTIONS">
                <BeerAdded />
              </PermissionPath>
            ),
          },
          {
            path: '/pivo/puff',
            element: (
              <PermissionPath permission="MANAGE_TRANSACTIONS">
                <PuffTable />
              </PermissionPath>
            ),
          },
          // {
          //   path: '/nabava',
          //   element: <Nabava />,
          // },
          // {
          //   path: '/zaloge',
          //   element: <Zaloge />,
          // },
        ],
      },

      // USERS
      {
        path: '/user',
        element: (
          <ProtectedPath redirectUrl="/auth">
            <Outlet />
          </ProtectedPath>
        ),
        children: [
          {
            path: '/user',
            element: <EditSelf />,
          },
          {
            path: '/user/:id',
            element: (
              <PermissionPath permission="MANAGE_USERS">
                <UserView />
              </PermissionPath>
            ),
          },
          {
            path: '/user/edit',
            element: (
              <PermissionPath permission="MANAGE_USERS">
                <UserEditing />
              </PermissionPath>
            ),
          },
          {
            path: '/user/edit/:id',
            element: (
              <PermissionPath permission="MANAGE_USERS">
                <EditUserPage />
              </PermissionPath>
            ),
          },
        ],
      },

      // PRANJE
      {
        path: '/pranje',
        element: (
          <ProtectedPath redirectUrl="/auth">
            <Outlet />
          </ProtectedPath>
        ),
        children: [
          {
            path: '/pranje/novo',
            element: (
              <PermissionPath permission="CAN_WASH">
                <WashingTimetable />
              </PermissionPath>
            ),
          },
          {
            path: '/pranje/moje',
            element: (
              <PermissionPath permission="CAN_WASH">
                <MyWashing />
              </PermissionPath>
            ),
          },
          {
            path: '/pranje/info',
            element: <PranjeInfo />,
          },
        ],
      },

      // ADMIN
      {
        path: '/admin/enroll',
        element: (
          <ProtectedPath redirectUrl="/auth">
            <PermissionPath permission="ENROLL">
              <EnrollUser />
            </PermissionPath>
          </ProtectedPath>
        ),
      },
    ],
  },

  // OTHER
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
  {
    path: '/*',
    element: '404',
  },

  // AUTH
  {
    path: '/auth',
    element: <Authentication />,
  },
]);
