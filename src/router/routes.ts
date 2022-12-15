import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
        name: 'index',
      },
      {
        path: 'guide',
        component: () => import('pages/navigation/AppGuide.vue'),
        name: 'guide',
      },
      {
        path: 'dashboard',
        component: () => import('pages/navigation/HistoryDashboard.vue'),
        name: 'dashboard',
      },
      {
        path: 'settings',
        component: () => import('pages/navigation/AppSettings.vue'),
        name: 'settings',
      },
      {
        path: 'login',
        component: () => import('pages/users/UserLogIn.vue'),
        name: 'login',
      },
      {
        path: 'signup',
        component: () => import('pages/users/UserSignUp.vue'),
        name: 'signup',
      },
    ],
  },
  {
    path: '/users',
    component: () => import('layouts/MainLayout.vue'),
    children: [],
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
