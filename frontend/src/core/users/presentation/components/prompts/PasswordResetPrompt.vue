<template>
  <q-dialog v-model="userStore.resetPasswordPrompt" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <span
          >이메일로 비밀번호 재설정을 위한 링크가 발송됩니다. 계속
          하시겠습니까?</span
        >
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="취소" color="primary" v-close-popup />
        <q-btn
          label="확인"
          color="primary"
          v-close-popup
          @click="sendResetPasswordEmailBtn"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { userMsg } from 'src/core/users/domain/user.const';
import { sendResetPasswordEmailFn } from 'src/core/users/infra/http/user.api';
import { useUserStore } from 'src/core/users/infra/store/user.store';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const $router = useRouter();
const userStore = useUserStore();

const sendResetPasswordEmailBtn = () => {
  resetPassword();
};

const resetPassword = async (): Promise<void> => {
  if (userStore.user !== null) {
    const data = {
      email: userStore.user.email,
    };

    await sendResetPasswordEmailFn(data);
  } else {
    $q.notify({
      color: 'negative',
      message: userMsg.INVALID_LOGIN_DATA,
      icon: 'error',
    });

    await $router.push({ name: 'login' });
  }
};
</script>
