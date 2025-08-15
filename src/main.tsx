import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { mantineModals } from './mantine/modals/modals.tsx';
import { mantineTheme } from './mantine/theme.ts';
import { router } from './router/router.tsx';
import { DatesProvider } from '@mantine/dates';
import 'dayjs/locale/sl';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/spotlight/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DatesProvider
      settings={{
        locale: 'sl-SI',
        firstDayOfWeek: 0,
        weekendDays: [0],
      }}
    >
      <MantineProvider theme={mantineTheme}>
        <Notifications />
        <ModalsProvider modals={mantineModals}>
          <RouterProvider router={router} />
        </ModalsProvider>
      </MantineProvider>
    </DatesProvider>
  </React.StrictMode>,
);
