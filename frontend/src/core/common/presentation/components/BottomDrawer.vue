<template>
  <div class="row wrap justify-center">
    <div id="q-app">
      <div class="q-pt-xs">
        <q-card
          class="slide-drawer slide-drawer--bottom text-black column no-wrap q-pt-sm q-px-sm"
          :class="`slide-drawer--open-${drawerMode}`"
          style="position: fixed; bottom: 0; right: 20%; left: 20%"
          :style="drawerStyle"
        >
          <q-card-section
            class="slide-drawer__handler--horizontal row flex-center justify-between q-pa-none"
            v-touch-pan.mouse.vertical="slideDrawer"
          >
            <div class="row q-px-none">
              <!--        Add routines button-->
              <div>
                <q-btn
                  v-if="!builderStoreRefs.routineInBuilder.value.routineToTimer"
                  @click="createRoutineBtn"
                  :disable="!timerStoreRefs.listTimers.value.length"
                  dense
                  icon="add"
                  flat
                  text-color="positive"
                  class="q-px-none q-mx-none"
                  size="0.6rem"
                />
                <q-tooltip anchor="top middle" self="top middle">
                  <div v-if="timerStoreRefs.listTimers.value.length">
                    루틴을 생성합니다.
                  </div>
                  <div v-else>
                    루틴을 생성하려면 최소 1개의 타이머가 필요합니다.
                  </div>
                </q-tooltip>
              </div>
              <!--        Save routines button-->
              <div v-if="builderStore.routineInBuilder.routineToTimer">
                <q-btn
                  @click="saveRoutineBtn"
                  dense
                  icon="save"
                  flat
                  text-color="positive"
                  size="0.6rem"
                  class="q-pr-sm"
                />
                <q-tooltip anchor="top middle" self="top middle">
                  루틴을 저장합니다.
                </q-tooltip>
              </div>
            </div>

            <div class="cursor-pointer open-dash" @click="cycleDrawer"></div>

            <!--        Cancel routines button-->
            <div v-if="builderStore.routineInBuilder.routineToTimer">
              <q-btn
                @click="resetBuilder"
                dense
                icon="cancel"
                flat
                text-color="positive"
                size="0.6rem"
                class="q-pr-sm"
              />
              <q-tooltip anchor="top middle" self="top middle">
                루틴 생성 혹은 수정을 취소합니다.
              </q-tooltip>
            </div>
            <div v-if="!builderStore.routineInBuilder.routineToTimer" />
          </q-card-section>

          <!--            Routine list-->
          <q-card style="height: 47vh">
            <q-card-section class="row wrap justify-between q-py-none">
              <div class="col">
                <RoutineMain></RoutineMain>
              </div>
            </q-card-section>
          </q-card>

          <!--    CreateRoutine dialog-->
          <q-dialog
            v-model="builderWarn"
            persistent
            @keyup.enter="
              builderWarn = false;
              builderPrompt = true;
            "
            @keyup.esc.prevent="builderWarn = false"
          >
            <q-card style="min-width: 350px">
              <q-card-section>
                <div class="text-h6">
                  <q-icon /> name="warning"> Confirmation
                </div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <div>
                  현재 작업중인 루틴이 있습니다. 루틴 생성을 계속할 경우
                  저장되지 않은 내용은 삭제됩니다. 계속하시겠습니까?
                </div>
              </q-card-section>

              <q-card-actions align="right" class="text-primary">
                <q-btn flat label="Cancel" v-close-popup />
                <q-btn
                  flat
                  label="Confirm"
                  color="red"
                  v-close-popup
                  @click="builderPrompt = true"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <!--  Create routines prompt-->
          <q-dialog v-model="builderPrompt" persistent>
            <q-card style="min-width: 350px">
              <q-card-section>
                <div class="text-h6">새로운 루틴 이름</div>
              </q-card-section>

              <q-card-section class="q-pt-none">
                <q-input
                  dense
                  v-model="routineName"
                  autofocus
                  @keyup.enter.prevent="createRoutine"
                  @keyup.esc.prevent="builderPrompt = false"
                />
              </q-card-section>

              <q-card-actions align="right" class="text-primary">
                <q-btn flat label="Cancel" v-close-popup />
                <q-btn
                  flat
                  label="Confirm"
                  color="green"
                  v-close-popup
                  @click="createRoutine"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash-es';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useBuilderStore } from 'src/core/builder/infra/store/builder.store';
import { useSelectorStore } from 'src/core/common/infra/store/selector.store';
import { IRoutine } from 'src/core/routines/domain/routine.model';
import { useRoutineStore } from 'src/core/routines/infra/store/routine.store';
import RoutineMain from 'src/core/routines/presentation/RoutineMain.vue';
import { useTimerStore } from 'src/core/timers/infra/store/timer.store';
import { useUserStore } from 'src/core/users/infra/store/user.store';
import { isEmptyObj } from 'src/util/is-empty-object.util';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const selectorStore = useSelectorStore();
const routineStore = useRoutineStore();
const timerStore = useTimerStore();
const builderStore = useBuilderStore();
const userStore = useUserStore();

const timerStoreRefs = storeToRefs(timerStore);
const builderStoreRefs = storeToRefs(builderStore);
const selectorStoreRefs = storeToRefs(selectorStore);
const routineStoreRefs = storeToRefs(routineStore);

const cancelBtnPrompt = ref(false);

const $q = useQuasar();
const $router = useRouter();

const builderPrompt = ref(false);
const builderWarn = ref(false);
const routineName = ref('');

const drawerMinHeight = 36;
const drawerTopOffset = 100;
const drawerOpenRatioHalf = 50;

let animateTimeout: number;

const createRoutineBtn = () => {
  if (isEmptyObj(builderStore.getBuilder)) {
    builderPrompt.value = true;
  } else {
    builderWarn.value = true;
  }
};

const createRoutine = () => {
  builderStore.createRoutine(routineName.value);
  builderPrompt.value = false;
  selectorStoreRefs.editNow.value = 'builder';
};

const saveRoutineBtn = () => {
  const routine = builderStore.routineInBuilder;

  if (routine.routineToTimer.length === 0) {
    $q.notify({
      color: 'negative',
      icon: 'warning',
      message:
        '루틴이 비어있습니다. 우측 타이머 영역에서 루틴을 끌어와 추가해주세요.',
    });
  } else {
    saveRoutine(routine);
    resetBuilder();
    selectorStoreRefs.editNow.value = '';
  }
};

const saveRoutine = async (routine: IRoutine) => {
  if (userStore.user !== null) {
    await timerStore.saveTimer();
    await builderStore.saveRoutine(routine);
    await routineStore.fetchAll();
  } else {
    routineStore.routineIds.push(routine.id);
    routineStore.routine[routine.id] = routine;
  }

  selectorStoreRefs.editNow.value = '';
};

const resetBuilder = () => {
  builderStore.$reset();
  cancelBtnPrompt.value = false;
  selectorStoreRefs.editNow.value = '';
  builderStore.routineInBuilder = _.cloneDeep({} as IRoutine);
};

const drawerMaxHeight = computed(() => {
  return Math.max(0, window.innerHeight - drawerTopOffset);
});

const drawerOpenRatio = computed(() => {
  return Math.round(
    (Math.max(0, routineStoreRefs.bottomDrawerHeight.value - drawerMinHeight) /
      Math.max(1, drawerMaxHeight.value - drawerMinHeight)) *
      100
  );
});

const drawerStyle = computed(() => {
  return {
    height: `${drawerMaxHeight.value}px`,
    transform: `translateY(${-routineStoreRefs.bottomDrawerHeight.value}px)`,
  };
});

let drawerMode = computed(() => {
  if (drawerOpenRatio.value > drawerOpenRatioHalf) {
    return 'full';
  }

  return drawerOpenRatio.value > 0 ? 'half' : 'handler';
});

const slideDrawer = (ev: {
  direction: string;
  delta: { x: number; y: number };
  isFinal: boolean;
}) => {
  const { direction, delta, isFinal } = ev;
  routineStoreRefs.bottomDrawerHeight.value = Math.max(
    drawerMinHeight,
    Math.min(
      drawerMaxHeight.value,
      routineStoreRefs.bottomDrawerHeight.value - delta.y
    )
  );

  if (isFinal) {
    const aboveHalf = drawerOpenRatio.value > drawerOpenRatioHalf;
    const targetHeight =
      direction === 'up'
        ? aboveHalf
          ? drawerMaxHeight.value
          : Math.round(drawerMaxHeight.value / 2)
        : aboveHalf
        ? Math.round(drawerMaxHeight.value / 2)
        : drawerMinHeight;

    animateDrawerTo(targetHeight);
  }
};

const cycleDrawer = () => {
  const targetHeight =
    drawerMode.value === 'handler'
      ? Math.round(drawerMaxHeight.value / 2)
      : drawerMode.value === 'half'
      ? drawerMaxHeight.value
      : drawerMinHeight;

  animateDrawerTo(targetHeight);
};

const animateDrawerTo = (height: number) => {
  clearTimeout(animateTimeout);

  const diff = height - routineStoreRefs.bottomDrawerHeight.value;

  if (diff !== 0) {
    routineStoreRefs.bottomDrawerHeight.value +=
      Math.abs(diff) < 2 ? diff : Math.round(diff / 2);

    animateTimeout = window.setTimeout(() => {
      animateDrawerTo(height);
    }, 30);
  }
};

onMounted(() => {
  window.addEventListener('resize', () => {
    routineStoreRefs.bottomDrawerHeight.value = drawerMinHeight;
  });
});

onBeforeUnmount(() => {
  clearTimeout(animateTimeout);
});
</script>

<style lang="scss" scoped>
.area {
  background-color: #f2f2f2;
  border-radius: 30px;
}

.q-dialog__inner > div {
  box-shadow: none;
  border: solid rgba(0, 0, 0, 0.12) 0.1px;
  // border:solid grey 0.01px;
}

.slide-drawer {
  &--bottom {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;

    bottom: unset;
    top: 100%;
    transition: background-color 0.3s ease-in-out;

    > div:last-child,
    > img:last-child {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  &__handler {
    &--horizontal {
      cursor: grab;
      > .open-dash {
        width: 60px;
        height: 8px;
        border-radius: 4px;
        background-color: #003333;
      }
    }
  }
}
</style>
