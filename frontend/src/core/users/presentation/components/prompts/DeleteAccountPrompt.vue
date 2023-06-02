<template>
  <q-dialog v-model="userStore.deleteAccountPrompt">
    <q-card style="min-width: 350px; max-width: 470px">
      <q-card-section>
        <div class="text-h6">계정 삭제</div>
        <div>
          계정을 삭제하면 계정과 관련된 모든 데이터가 영구적으로 제거됩니다.
        </div>
        <div>
          계정 삭제를 진행하시려면 아래 입력창에 <b>Delete account</b>를
          입력해주세요.
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-input
          v-model="validation"
          label="Delete account"
          dense
          autofocus
          debounce="300"
          @keyup.enter.prevent="onSubmit"
          @keyup.esc.prevent="userStore.changeEmailPrompt = false"
          :error="!!nameError"
          :error-message="nameError"
        />
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" v-close-popup @click="resetForm" />
        <q-btn
          flat
          label="Confirm"
          color="green"
          type="submit"
          @click="onSubmit"
          :disable="!isEmptyObj(errors)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query';
import { toFormValidator } from '@vee-validate/zod';
import { useQuasar } from 'quasar';
import { usePanelStore } from 'src/core/panel/infra/store/panel.store';
import { useRoutineStore } from 'src/core/routines/infra/store/routine.store';
import { useTimerStore } from 'src/core/timers/infra/store/timer.store';
import { deleteAccountFn } from 'src/core/users/infra/http/user.api';
import { useUserStore } from 'src/core/users/infra/store/user.store';
import { IValidationInput } from 'src/type-defs/userTypes';
import { isEmptyObj } from 'src/util/is-empty-object.util';
import { useField, useForm } from 'vee-validate';
import { userMsg } from 'src/core/users/domain/user.const';
import { useRouter } from 'vue-router';
import * as zod from 'zod';

const $q = useQuasar();
const $router = useRouter();
const userStore = useUserStore();
const timerStore = useTimerStore();
const routineStore = useRoutineStore();
const panelStore = usePanelStore();

const deleteAccountSchema = toFormValidator(
  zod
    .object({
      validation: zod.string({
        required_error:
          "계정 삭제를 진행하시려면 'Delete account'를 정확하게 입력해주세요. ",
      }),
    })
    .refine((data) => data.validation === 'Delete account', {
      path: ['validation'],
      message:
        "계정 삭제를 진행하시려면 'Delete account'를 정확하게 입력해주세요. ",
    })
);

const { handleSubmit, resetForm, errors } = useForm({
  validationSchema: deleteAccountSchema,
});

const {
  value: validation,
  errorMessage: nameError,
  setErrors,
} = useField<string>('validation');

const { isLoading, mutate } = useMutation(
  (credentials: IValidationInput) => deleteAccountFn(credentials),
  {
    onError: (err: any) => {
      const response = err.response.data;

      if (response.message === 'Wrong input value') {
        $q.notify({
          color: 'negative',
          message: userMsg.UNKNOWN_ERROR,
          icon: 'warning',
        });
      } else {
        setErrors(userMsg.UNKNOWN_ERROR);
      }
    },
    onSuccess: () => {
      userStore.deleteAccountPrompt = false;

      $q.notify({
        color: 'positive',
        message: userMsg.DELETE_ACCOUNT_SUCCESS,
        icon: 'done',
      });

      userStore.$reset();
      timerStore.$reset();
      routineStore.$reset();
      panelStore.$reset();

      $router.push({ name: 'panel' });
    },
  }
);

const onSubmit = handleSubmit((values) => {
  mutate({
    validation: values.validation,
  });
});
</script>
