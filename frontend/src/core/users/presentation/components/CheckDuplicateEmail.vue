<template>
  <div class="q-pa-md absolute-center" style="min-width: 400px">
    <div class="text-h4 q-mb-lg">Check Email</div>
    <q-form
      @submit.prevent="onSubmit"
      class="q-gutter-sm"
      autocorrect="off"
      autocapitalize="off"
      autocomplete="off"
      spellcheck="false"
    >
      <q-input
        filled
        v-model="email"
        label="Email"
        hint="로그인에 사용할 이메일을 입력해주세요."
        :error-message="emailError"
        :error="!!emailError"
        debounce="500"
      />
      <div class="row">
        <q-btn label="check email" color="primary" type="submit" />
        <div class="q-space"></div>
        <q-btn
          label="cancel"
          to="/login"
          color="primary"
          flat
          class="q-ml-sm"
        />
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query';
import { toFormValidator } from '@vee-validate/zod';
import { useQuasar } from 'quasar';
import { CHECK_EMPTY, userMsg } from 'src/core/users/domain/user.const';
import { checkEmailFn } from 'src/core/users/infra/http/user.api';
import { useUserStore } from 'src/core/users/infra/store/user.store';
import { IEmailInput } from 'src/type-defs/userTypes';
import { useField, useForm } from 'vee-validate';
import { useRouter } from 'vue-router';
import * as zod from 'zod';

const router = useRouter();
const $q = useQuasar();

const userStore = useUserStore();

const registerSchema = toFormValidator(
  zod.object({
    email: zod
      .string()
      .min(CHECK_EMPTY, userMsg.EMPTY_USER_EMAIL)
      .email(userMsg.INVALID_USER_EMAIL),
  })
);

const { handleSubmit, resetForm, setFieldError } = useForm({
  validationSchema: registerSchema,
});

const { value: email, errorMessage: emailError } = useField('email');

const { isLoading, mutate } = useMutation(
  (email: IEmailInput) => checkEmailFn(email),
  {
    onError: () => {
      setFieldError('email', '중복된 이메일입니다. 다른 메일을 사용해주세요.');
    },
    onSuccess: (res) => {
      userStore.verifiedEmail = res.email;

      router.push({ name: 'signup' });
    },
  }
);

// TODO: vee-validate 활용하여 악의적 반복 request 제한
const onSubmit = handleSubmit((values) => {
  mutate({
    email: values.email,
  });
  resetForm();
});
</script>
