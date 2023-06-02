<template>
  <div v-if="routineInBuilder.routineToTimer" class="highlight-routine">
    <BuilderMain />
  </div>
  <q-scroll-area
    :thumb-style="thumbStyle"
    :content-style="contentStyle"
    :content-active-style="contentActiveStyle"
    style="height: 100vh"
  >
    <div v-if="listRoutine.length">
      <div
        v-for="routine in listRoutine"
        :key="routine"
        class="row justify-start wrap q-pa-sx q-mt-sx"
        style="border-bottom: 1px solid black; height: 150px"
      >
        <RoutineLoader :routine="routine" @remove="removeRoutine" />
      </div>
    </div>
    <div
      v-if="
        routineStore.listRoutine.length === 0 &&
        !routineInBuilder.routineToTimer
      "
      class="text-h6 text-weight-bold"
    >
      <span>
        루틴이 비어있습니다. 루틴을 생성하려면 좌측 상단의 '+' 버튼을
        눌러주세요.
      </span>
    </div>
    <q-space style="height: 500px" />
  </q-scroll-area>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useBuilderStore } from 'src/core/builder/infra/store/builder.store';
import BuilderMain from 'src/core/builder/presentation/BuilderMain.vue';
import { usePanelStore } from 'src/core/panel/infra/store/panel.store';
import { useRoutineStore } from 'src/core/routines/infra/store/routine.store';
import RoutineLoader from 'src/core/routines/presentation/components/RoutineLoader.vue';
import { useUserStore } from 'src/core/users/infra/store/user.store';

const routineStore = useRoutineStore();
const routineStoreRefs = storeToRefs(routineStore);
const { listRoutine } = routineStoreRefs;
const builderStore = useBuilderStore();
const builderStoreRefs = storeToRefs(builderStore);
const { routineInBuilder } = builderStoreRefs;
const userStore = useUserStore();
const userStoreRef = storeToRefs(userStore);
const panelStore = usePanelStore();

if (!!userStoreRef.user) {
  routineStore.fetchAll();
}

const removeRoutine = (id: string) => {
  (panelStore.mode = ''), routineStore.remove(id);
};

const contentStyle = {
  backgroundColor: 'transparent',
  color: 'black',
};

const contentActiveStyle = {
  backgroundColor: 'transparent',
  color: 'black',
};

const thumbStyle = {
  bottom: '0px',
  borderRadius: '0px',
  backgroundColor: 'grey',
  height: '1rem',
  opacity: '0.5',
};
</script>

<style lang="scss" scoped>
.highlight-routine {
  border: solid $fourth;
}

.flex-break {
  flex: 1 0 100% !important;
}
</style>
