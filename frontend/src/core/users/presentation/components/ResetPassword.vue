<template>
  <div class="q-pa-md absolute-center" style="min-width: 400px">
    <div class="text-h4 q-mb-lg">Reset Password</div>
    <q-form
      @submit.prevent="onSubmit"
      class="q-gutter-sm"
      autocorrect="off"
      autocapitalize="off"
      autocomplete="off"
      spellcheck="false"
    >
      <q-input
        v-model="password"
        filled
        label="Password"
        :type="isPwd ? 'password' : 'text'"
        hint="8 - 32자까지 설정할 수 있습니다."
        :error-message="passwordError"
        :error="!!passwordError"
        debounce="500"
      >
        <template v-slot:append>
          <q-icon
            :name="isPwd ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="isPwd = !isPwd"
          />
        </template>
      </q-input>
      <q-input
        v-model="confirmPassword"
        filled
        label="Re-enter password"
        :type="isPwd ? 'password' : 'text'"
        hint="비밀번호를 한번 더 입력해주세요."
        :error-message="confirmPasswordError"
        :error="!!confirmPasswordError"
        debounce="500"
      />
      <div class="row">
        <q-btn
          label="Reset password"
          color="primary"
          type="submit"
          :disable="!isEmptyObj(errors)"
        />
        <div class="q-space"></div>
        <q-btn label="CANCEL" to="/" color="primary" flat class="q-ml-sm" />
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import {
  CHECK_EMPTY,
  userMsg,
  userVar,
} from 'src/core/users/domain/user.const';
import { changePassword } from 'src/core/users/infra/http/user.api';
import { isEmptyObj } from 'src/util/is-empty-object.util';
import * as zod from 'zod';
import { IChangePasswordInput } from 'src/type-defs/userTypes';
import { ref } from 'vue';
import { toFormValidator } from '@vee-validate/zod';
import { useField, useForm } from 'vee-validate';
import { useMutation } from '@tanstack/vue-query';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();
const isPwd = ref(true);

const registerSchema = toFormValidator(
  zod
    .object({
      password: zod
        .string()
        .min(CHECK_EMPTY, userMsg.EMPTY_USER_PASSWORD)
        .min(userVar.PASSWORD_MIN_LEN, userMsg.BELOW_MIN_USER_PASSWORD)
        .max(userVar.PASSWORD_MAX_LEN, userMsg.ABOVE_MAX_USER_PASSWORD),
      confirmPassword: zod
        .string()
        .min(CHECK_EMPTY, userMsg.EMPTY_CONFIRM_PASSWORD),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: userMsg.MISMATCH_PASSWORD,
    })
);

const { handleSubmit, resetForm, errors } = useForm({
  validationSchema: registerSchema,
});

const { value: password, errorMessage: passwordError } =
  useField<string>('password');
const { value: confirmPassword, errorMessage: confirmPasswordError } =
  useField<string>('confirmPassword');

const { isLoading, mutate } = useMutation(
  (credentials: IChangePasswordInput) => changePassword(credentials),
  {
    onError: () => {
      $q.notify({
        type: 'negative',
        message:
          '비밀번호를 설정할 수 없습니다. 오류가 반복되면 관리자에게 문의해주세요',
        icon: 'warning',
      });
    },
    onSuccess: () => {
      $q.notify({
        type: 'positive',
        message: userMsg.RESET_PASSWORD_SUCCESS,
        icon: 'done',
      });
      router.push({ name: 'panel' });
    },
  }
);

const onSubmit = handleSubmit((values) => {
  mutate({
    password: values.password,
    confirmPassword: values.confirmPassword,
  });
  resetForm();
});
</script>
