<script setup lang="ts">
import { useQuasar } from 'quasar';
import { getMeFn, verifyEmailFn } from 'src/core/users/infra/http/user.api';
import { useUserStore } from 'src/core/users/infra/store/user.store';
import { onBeforeMount } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();

const userStore = useUserStore();

onBeforeMount(async () => {
  await router.isReady();
  const { signupToken } = route.query;

  try {
    const result = await verifyEmailFn(signupToken as string);
    if (result.success) {
      if (userStore.user) {
        const user = await getMeFn();
        userStore.setUser(user);
      }

      await router.push({ name: 'panel' });

      $q.notify({
        type: 'positive',
        message: '이메일이 인증되었습니다.',
        icon: 'done',
      });
    }
  } catch (err: any) {
    $q.notify({
      type: 'warning',
      message: '이미 인증된 이메일이거나 유효하지 않은 토큰입니다.',
      icon: 'warning',
    });

    await router.push({ name: 'panel' });
  }
});
</script>
