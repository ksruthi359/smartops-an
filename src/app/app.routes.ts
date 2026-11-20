
import { Routes } from '@angular/router';

import { Login } from './login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { OrgRequests } from './pages/org-requests/org-requests';
import { AllOrganizations } from './pages/all-organizations/all-organizations';
import { Tickets } from './tickets/tickets';
import { SystemSettings } from './pages/system settings/system settings';
import { Notifications } from './pages/notifications/notifications';
import { Settings } from './pages/settings/settings';
import { TicketDetail } from './tickets/ticket-detail';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'super-admin',
    component: Dashboard
  },
  {
    path: 'super-admin/requests',
    component: OrgRequests
  },
  {
    path: 'super-admin/organizations',
    component: AllOrganizations
  },
  {
    path: 'super-admin/tickets',
    component: Tickets
  },
  {
    path: 'super-admin/settings',
    component: SystemSettings
  },
  {
    path: 'super-admin/notifications',
    component: Notifications
  },
  {
    path: 'settings',
    component: Settings
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
  path: 'super-admin/tickets',
  component: Tickets
},
{
  path: 'super-admin/tickets/:id',
  component: TicketDetail
},
];
