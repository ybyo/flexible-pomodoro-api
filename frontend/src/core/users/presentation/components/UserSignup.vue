<template>
  <div class="q-pa-md absolute-center" style="min-width: 400px">
    <div class="text-h4 q-mb-lg">Sign up</div>
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
        hint="로그인에 사용될 이메일입니다."
        :error-message="emailErrorMessage"
        :error="!!emailErrorMessage"
        debounce="500"
        disable
      />
      <q-input
        filled
        v-model="username"
        label="Username"
        :hint="!usernameErrorMessage ? '유저네임을 설정해주세요.' : ''"
        :error-message="usernameErrorMessage"
        :error="!!usernameErrorMessage"
        debounce="500"
      />
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
            :username="isPwd ? 'visibility_off' : 'visibility'"
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
          label="SIGN UP"
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
import { useMutation } from '@tanstack/vue-query';
import { toFormValidator } from '@vee-validate/zod';
import * as filter from 'leo-profanity';
import { useQuasar } from 'quasar';
import {
  CHECK_EMPTY,
  userMsg,
  userVar,
} from 'src/core/users/domain/user.const';
import { signUpUserFn } from 'src/core/users/infra/http/user.api';
import { useUserStore } from 'src/core/users/infra/store/user.store';
import { ISignupInput } from 'src/type-defs/userTypes';
import { isEmptyObj } from 'src/util/is-empty-object.util';
import { useField, useForm } from 'vee-validate';
import { onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';
import * as zod from 'zod';

const $q = useQuasar();
const isPwd = ref(true);
const router = useRouter();
const userStore = useUserStore();

const registerSchema = toFormValidator(
  zod
    .object({
      username: zod
        .string()
        .min(userVar.USER_NAME_MIN_LEN, userMsg.BELOW_MIN_USER_NAME)
        .refine((value) => /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/.test(value), {
          message: '이름에 사용 불가능한 문자가 포함되어 있습니다.',
        })
        .refine(
          (value) => {
            filter.add(['admin', 'webmaster']);
            const formatted = value.replace(/[0-9\s]/g, '');

            return !filter.check(formatted);
          },
          { message: userMsg.PROFANE_WORDS }
        ),
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

const {
  value: email,
  errorMessage: emailErrorMessage,
  setErrors: setEmailErrors,
} = useField<string>('email');
const {
  value: username,
  errorMessage: usernameErrorMessage,
  setErrors: setUsernameErrors,
} = useField<string>('username');
const { value: password, errorMessage: passwordError } =
  useField<string>('password');
const { value: confirmPassword, errorMessage: confirmPasswordError } =
  useField<string>('confirmPassword');

onBeforeMount(() => {
  email.value = userStore.verifiedEmail !== null ? userStore.verifiedEmail : '';
});

const { mutate } = useMutation(
  (credentials: ISignupInput) => signUpUserFn(credentials),
  {
    onError: (err: any) => {
      const errorMessage = err.response.data.message;

      if (errorMessage === username.value) {
        setUsernameErrors('이미 사용 중인 유저네임입니다.');
      } else if (errorMessage === email.value) {
        setEmailErrors('이미 사용 중인 이메일입니다.');
      } else if (
        errorMessage === 'Name contains prohibited words' ||
        errorMessage[0] ===
          'username must match /^[A-Za-z0-9]+$/ regular expression'
      ) {
        setUsernameErrors('이름에 사용 불가능한 문자가 포함되어 있습니다.');
      } else {
        $q.notify({
          type: 'negative',
          message: 'UNKNOWN_ERROR',
        });
      }
    },
    onSuccess: (res, user) => {
      $q.notify({
        type: 'positive',
        message: user.email + userMsg.SEND_USER_SIGNUP_VERIFICATION_EMAIL,
      });
      router.push({ name: 'panel' });
      userStore.verifiedEmail = null;
    },
  }
);

const onSubmit = handleSubmit((values) => {
  if (!!email.value) {
    mutate({
      email: email.value,
      username: values.username,
      password: values.password,
      confirmPassword: values.confirmPassword,
    });
  } else {
    $q.notify({
      type: 'negative',
      color: 'negative',
      message:
        '이메일 칸이 비어있습니다. 이메일 인증 절차부터 다시 진행해주세요.',
      icon: 'warning',
    });
  }
});
</script>
