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
          import(
            '../core/users/presentation/components/CheckDuplicateEmail.vue'
          ),
        name: 'check-email',
        beforeEnter: (to, from, next) => {
          if (from.name !== 'login') next('/');
          else next();
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
        beforeEnter: (to, from, next) => {
          if (from.name !== 'check-email') next('/');
          else next();
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
          import('../core/users/presentation/components/VerifySignupToken.vue'),
        name: 'verify-email',
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
        path: 'verify-change-email-token',
        component: () =>
          import('../core/users/presentation/components/ChangeEmailVerify.vue'),
        name: 'verify-change-email-token',
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
        beforeEnter: (to, from, next) => {
          if (from.name !== 'verify-reset-password') next('/');
          else next();
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
