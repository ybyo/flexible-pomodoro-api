<template>
  <div class="row justify-between">
    <q-space class="col-2" />
    <div class="row justify-between q-mt-xl col-8">
      <div class="text-h4">Account Setting</div>
    </div>
    <q-space class="col-2" />
  </div>

  <q-separator spaced="lg" />

  <div class="row">
    <div class="col-2"></div>
    <div class="col-9 q-gutter-lg">
      <div class="row justify-start items-end">
        <div class="text-h6 col-8">
          Email
          <q-field
            outlined
            style="min-width: 5vw; width: 20vw"
            dense
            class="q-pt-xs row flex"
          >
            <template v-slot:control>
              <div class="self-center no-outline" tabindex="0">
                {{ userStoreRefs.user?.value.email }}
              </div>
            </template>
          </q-field>
        </div>
        <q-btn
          outline
          class="col-3 text-no-wrap"
          text-color="black"
          :size="$q.screen.lt.md ? '0.8rem' : '0.9rem'"
          label="Change Email"
          @click="changeEmailBtn"
          style="min-width: 8rem"
        />
      </div>

      <div class="row justify-start items-end">
        <div class="text-h6 col-8">
          Name
          <q-field
            outlined
            style="min-width: 5vw; width: 20vw"
            dense
            class="q-pt-xs row flex"
          >
            <template v-slot:control>
              <div class="self-center full-width no-outline" tabindex="0">
                {{ userStoreRefs.user.value?.username }}
              </div>
            </template>
          </q-field>
        </div>
        <q-btn
          outline
          class="col-3 text-no-wrap"
          text-color="black"
          :size="$q.screen.lt.md ? '0.8rem' : '0.9rem'"
          label="Change Name"
          @click="changeNameBtn"
          style="min-width: 8rem"
        />
      </div>

      <div class="row justify-start q-pt-lg items-end">
        <div class="text-h6 col-8">
          Password
          <div class="text-caption q-pt-xs">
            패스워드를 재설정합니다. 이메일이 필요합니다.
          </div>
        </div>
        <q-btn
          outline
          class="col-3 text-no-wrap"
          text-color="black"
          :size="$q.screen.lt.md ? '0.8rem' : '0.9rem'"
          label="Change Password"
          @click="resetPasswordBtn"
          style="min-width: 8rem"
        />
      </div>

      <div class="row justify-start q-pt-lg items-end">
        <div class="text-h6 col-8">
          Delete Account
          <div class="text-caption q-pt-xs">
            계정을 삭제합니다. 모든 데이터가 제거됩니다.
          </div>
        </div>
        <q-btn
          class="col-3 text-no-wrap"
          color="negative"
          text-color="white"
          :size="$q.screen.lt.md ? '0.8rem' : '0.9rem'"
          label="Delete Account"
          @click="deleteAccountBtn"
          style="min-width: 8rem"
        />
      </div>
    </div>
  </div>

  <!-- Dialogs-->
  <PasswordResetPrompt />
  <ChangeEmailPrompt />
  <ChangeNamePrompt />
  <DeleteAccountPrompt />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRoutineStore } from 'src/core/routines/infra/store/routine.store';
import { useUserStore } from 'src/core/users/infra/store/user.store';
import ChangeEmailPrompt from 'src/core/users/presentation/components/prompts/ChangeEmailPrompt.vue';
import ChangeNamePrompt from 'src/core/users/presentation/components/prompts/ChangeNamePrompt.vue';
import DeleteAccountPrompt from 'src/core/users/presentation/components/prompts/DeleteAccountPrompt.vue';
import PasswordResetPrompt from 'src/core/users/presentation/components/prompts/PasswordResetPrompt.vue';
import { onBeforeMount, onBeforeUnmount } from 'vue';

onBeforeMount(() => {
  routineStore.bottomDrawerHeight = 36;
});

onBeforeUnmount(() => {
  routineStore.bottomDrawerHeight = 348;
});

const userStore = useUserStore();
const userStoreRefs = storeToRefs(userStore);
const routineStore = useRoutineStore();

const resetPasswordBtn = () => {
  userStore.resetPasswordPrompt = !userStore.resetPasswordPrompt;
};

const changeEmailBtn = () => {
  userStore.changeEmailPrompt = !userStore.changeEmailPrompt;
};

const changeNameBtn = () => {
  userStore.changeNamePrompt = !userStore.changeNamePrompt;
};

const deleteAccountBtn = () => {
  userStore.deleteAccountPrompt = !userStore.deleteAccountPrompt;
};
</script>

<style lang="scss" scoped>
.q-separator--horizontal {
  margin-inline: 10.5rem;
}
</style>
