<script setup lang="ts">
import { useQuasar } from 'quasar';
import { userMsg } from 'src/core/users/domain/user.const';
import { verifyResetPasswordTokenFn } from 'src/core/users/infra/http/user.api';
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();

onMounted(async () => {
  await router.isReady();
  const { resetPasswordToken: token } = route.query;

  try {
    await verifyResetPasswordTokenFn(token as string);
    await router.push({ name: 'reset-password' });

    $q.notify({
      type: 'positive',
      message: userMsg.VERIFY_RESET_PASSWORD_SUCCESS,
      icon: 'done',
    });
  } catch (err) {
    await router.push({ name: 'panel' });

    $q.notify({
      type: 'warning',
      message: '이미 사용된 토큰이거나 유효하지 않은 토큰입니다.',
      icon: 'warning',
    });
  }
});
</script>
