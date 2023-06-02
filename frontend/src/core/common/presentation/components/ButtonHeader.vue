<template>
  <div class="row justify-end q-gutter-md q-py-sm">
    <div class="q-pr-sm">
      <q-btn
        v-if="!userStoreRefs.user.value"
        to="/login"
        label="login"
        outline
        color="black"
      />
      <q-btn
        v-else
        @click="handleLogout"
        label="logout"
        outline
        color="black"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { usePanelStore } from 'src/core/panel/infra/store/panel.store';
import { useRoutineStore } from 'src/core/routines/infra/store/routine.store';
import { useUserStore } from 'src/core/users/infra/store/user.store';
import { useTimerStore } from 'src/core/timers/infra/store/timer.store';
import { logoutUserFn } from 'src/core/users/infra/http/user.api';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useMutation } from '@tanstack/vue-query';

const $q = useQuasar();
const router = useRouter();

const userStore = useUserStore();
const userStoreRefs = storeToRefs(userStore);
const timerStore = useTimerStore();
const routineStore = useRoutineStore();
const panelStore = usePanelStore();

const { mutate: logoutUser } = useMutation(() => logoutUserFn(), {
  onMutate: () => {
    userStore.$reset();
    timerStore.$reset();
    routineStore.$reset();
    panelStore.$reset();
    router.push({ name: 'login' });
  },
});

const handleLogout = () => {
  logoutUser();
};
</script>
