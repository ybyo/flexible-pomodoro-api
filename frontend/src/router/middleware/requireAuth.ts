import { Notify } from 'quasar';
import { getMeFn } from 'src/core/users/infra/http/user.api';
import { Router } from 'src/router';
import { NavigationGuardNext } from 'vue-router';

export default async function requireAuth({
  next,
  userStore,
  timerStore,
  routineStore,
}: {
  next: NavigationGuardNext;
  userStore: any;
  timerStore: any;
  routineStore: any;
}): Promise<void> {
  if (!userStore.user) {
    await Router.push({ name: 'login' });
    Notify.create({
      color: 'blue',
      message: '서비스를 이용하시려면 먼저 로그인 해주세요.',
    });

    return next();
  }

  try {
    const user = await getMeFn();
    if (user !== null) {
      userStore.setUser(user);
      timerStore.fetchAll();
      routineStore.fetchAll();
    } else {
      return next({ name: 'login' });
    }
  } catch (err) {
    Notify.create({
      type: 'warning',
      textColor: 'black',
      message: '회원인증 절차에 오류가 발생했습니다.',
      closeBtn: true,
    });
    return next({
      name: 'panel',
    });
  }

  return next();
}
