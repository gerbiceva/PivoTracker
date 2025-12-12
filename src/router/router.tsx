import { createBrowserRouter, Outlet } from 'react-router-dom';
import { ProtectedPath } from '../components/ProtectedPath';
import { PermissionPath } from '../components/PermissionPath';
import { BeerAdder } from '../components/views/Pivo/Adder/Adder';
import App from '../components/views/App';
import { Authentication } from '../components/views/auth/Auth';
import { PuffTable } from '../components/views/Pivo/Pufi/PufiTabela';
import { Transactions } from '../components/views/Pivo/Transactions/Transactions';
import { PivoByUser } from '../components/views/Pivo/User/PivoByUser';
import { AddWashingTimetable } from '../components/views/Washing/AddTimetable/AddWashingTimetable';
import { EnrollUser } from '../components/views/Admin/Users/Enroll';
import { PranjeInfo } from '../components/views/Washing/Info/PranjeInfo';
import { UserEditing } from '../components/views/UserManagement/UserEditing/UserEditing';
import { EditUserPage } from '../components/views/UserManagement/UserEditing/EditUserPage';
import { HomePage } from '../components/views/Homepage';
import { ManageEvent } from '../components/views/events/ManageEvent';
import { DisplayEvents } from '../components/views/events/DisplayEvents';
import { EventView } from '../components/views/events/EventView';
import { Items } from '../components/views/Pivo/Transactions/Items';
import { AddPromise } from '../components/views/Promises/AddPromise';
import { ManagePromises } from '../components/views/Promises/ManageObljube';
import { TopObljubeUsers } from '../components/views/Promises/TopObljubeUsers';
import { MyWashing } from '../components/views/Washing/MyWashing/MyWashing';
import { Alert, Stack } from '@mantine/core';
import { EditSelf } from '../components/views/UserManagement/ViewSelf';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,

    children: [
      // HOME
      {
        path: '/',
        element: (
          <ProtectedPath redirectUrl="/auth">
            <HomePage />
          </ProtectedPath>
        ),
      },

      // PIVO
      {
        path: '/pivo',
        element: (
          <ProtectedPath redirectUrl="/auth">
            <Stack>
              <Alert>
                Vse reči v zvezi z pivom so še malo tko tko. Dodajanje piva
                lahko uporabljas ampak te pregledi niso še super.
              </Alert>
              <Outlet />
            </Stack>
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
          // {
          //   index: true,
          //   element: (
          //     <PermissionPath permission="MANAGE_TRANSACTIONS">
          //       <Dashboard />
          //     </PermissionPath>
          //   ),
          // },

          {
            path: '/pivo/add',
            element: (
              <PermissionPath permission="MANAGE_TRANSACTIONS">
                <BeerAdder />
              </PermissionPath>
            ),
          },
          {
            path: '/pivo/puf',
            element: (
              <PermissionPath permission="MANAGE_TRANSACTIONS">
                <PuffTable />
              </PermissionPath>
            ),
          },
          {
            path: '/pivo/user/:id',
            element: (
              <PermissionPath permission="MANAGE_TRANSACTIONS">
                <PivoByUser />
              </PermissionPath>
            ),
          },
          {
            path: '/pivo/items',
            element: (
              <PermissionPath permission="MANAGE_TRANSACTIONS">
                <Items />
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
                <PivoByUser />
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

      // PROMISES
      {
        path: '/promises',
        element: (
          <ProtectedPath redirectUrl="/auth">
            <Outlet />
          </ProtectedPath>
        ),
        children: [
          {
            path: '/promises/create',
            element: (
              <PermissionPath permission="ADD_OBLJUBA">
                <AddPromise />
              </PermissionPath>
            ),
          },
          {
            path: '/promises/manage',
            element: (
              <PermissionPath permission="ADD_OBLJUBA">
                <ManagePromises />
              </PermissionPath>
            ),
          },
          {
            path: '/promises/view',
            element: <TopObljubeUsers />,
          },
        ],
      },

      // EVENTS
      {
        path: '/events',
        element: (
          <ProtectedPath redirectUrl="/auth">
            <Outlet />
          </ProtectedPath>
        ),
        children: [
          {
            path: '/events/create',
            element: (
              <PermissionPath permission="MANAGE_EVENTS">
                <ManageEvent />
              </PermissionPath>
            ),
          },
          {
            path: '/events/edit/:id',
            element: (
              <PermissionPath permission="MANAGE_EVENTS">
                <ManageEvent />
              </PermissionPath>
            ),
          },
          {
            index: true,
            element: <DisplayEvents />,
          },
          {
            path: '/events/:id',
            element: <EventView />,
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
                <AddWashingTimetable />
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
    path: '/*',
    element: '404',
  },

  // AUTH
  {
    path: '/auth',
    element: <Authentication />,
  },
]);
