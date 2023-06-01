<script setup lang="ts">
import { userMsg } from 'src/core/users/domain/user.const';
import { useUserStore } from 'src/core/users/infra/store/user.store';
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import {
  getMeFn,
  verifyChangeEmailTokenFn,
} from 'src/core/users/infra/http/user.api';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();

const userStore = useUserStore();

onMounted(async () => {
  await router.isReady();

  try {
    await verifyChangeEmailTokenFn(route.query.changeEmailToken as string);
    await userStore.setUser(await getMeFn());

    $q.notify({
      type: 'positive',
      message: userMsg.CHANGE_EMAIL_SUCCESS,
      icon: 'done',
    });
  } catch (err) {
    $q.notify({
      color: 'warning',
      textColor: 'black',
      message:
        '이메일 변경 중 오류가 발생했습니다. 이메일 변경을 다시 진행해주세요. 문제가 반복된다면 이메일 문의 바랍니다.',
      icon: 'warning',
    });
  } finally {
    await router.push({ name: 'user-setting' });
  }
});
</script>
