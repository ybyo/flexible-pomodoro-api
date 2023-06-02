import { Router } from 'src/router';
import { NavigationGuardNext } from 'vue-router';

export default async function skipAuth({
  next,
  userStore,
}: {
  next: NavigationGuardNext;
  userStore: any;
}) {
  if (userStore.user) {
    await Router.push({ name: 'panel' });
    return next();
  }

  return next();
}
