import requireAuth from 'src/router/middleware/requireAuth';
import skipAuth from 'src/router/middleware/skipAuth';
import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // TODO: Slot 활용하여 컴포넌트 재사용률 높이기(https://router.vuejs.org/guide/essentials/named-views.html#nested-named-views)
  {
    path: '/',
    component: () =>
      import('../core/common/presentation/layouts/AppLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('../core/panel/presentation/PanelMain.vue'),
        name: 'panel',
      },
      {
        path: 'login',
        component: () =>
          import('../core/users/presentation/components/UserLogin.vue'),
        name: 'login',
        meta: {
          middleware: [skipAuth],
        },
      },
      {
        path: 'check-email',
        component: () =>
          import('../core/users/presentation/components/UserCheckEmail.vue'),
        name: 'check-email',
        meta: {
          middleware: [skipAuth],
        },
        beforeEnter: (to, from) => {
          if (from.name !== 'login') {
            return false;
          }
        },
      },
      {
        path: 'signup',
        component: () =>
          import('../core/users/presentation/components/UserSignup.vue'),
        name: 'signup',
        meta: {
          middleware: [skipAuth],
        },
        beforeEnter: (to, from) => {
          if (from.name !== 'check-email') {
            return false;
          }
        },
      },
      // {
      //   path: 'guide',
      //   component: () => import('../core/guide/presentation/AppGuide.vue'),
      //   name: 'guide',
      // },
    ],
  },
  {
    path: '/users',
    children: [
      {
        path: 'verify-email',
        component: () =>
          import('../core/users/presentation/components/UserSignupVerify.vue'),
        name: 'verify-email',
        meta: {
          middleware: [skipAuth],
        },
      },
      {
        path: 'verify-reset-password',
        component: () =>
          import(
            '../core/users/presentation/components/ResetPasswordVerify.vue'
          ),
        name: 'verify-reset-password',
      },
      {
        path: 'verify-change-email',
        component: () =>
          import(
            '../core/users/presentation/components/ChangeEmailVerify.vue'
          ),
        name: 'verify-change-email',
      },
    ],
  },
  {
    path: '/users',
    component: () =>
      import('../core/common/presentation/layouts/AppLayout.vue'),
    children: [
      {
        path: 'setting',
        component: () =>
          import('../core/users/presentation/components/UserSetting.vue'),
        name: 'user-setting',
        meta: {
          middleware: [requireAuth],
        },
      },
      {
        path: 'reset-password',
        component: () =>
          import('../core/users/presentation/components/ResetPassword.vue'),
        name: 'reset-password',
        beforeEnter: (to, from) => {
          if (from.name !== 'verify-reset-password') {
            return false;
          }
        },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () =>
      import('../core/common/presentation/page/ErrorNotFound.vue'),
    name: 'error',
  },
];

export default routes;
