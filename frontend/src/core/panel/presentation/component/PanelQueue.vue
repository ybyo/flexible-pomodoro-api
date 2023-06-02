<template>
  <div
    v-if="
      !isEmptyObj(panelStoreRefs.timer.value) ||
      !isEmptyObj(panelStoreRefs.routine.value)
    "
    class="row fit justify-center"
  >
    <q-scroll-area class="full-width" style="height: 140px">
      <q-card class="flat no-shadow" style="background: transparent">
        <q-card-section class="q-py-md relative-position" style="top: 4px">
          <div class="row justify-center">
            <!--        Routine Mode-->
            <div
              v-if="panelStore.mode === 'routine'"
              class="row justify-start no-wrap"
              style="height: 100px; white-space: nowrap"
            >
              <div
                v-for="(t, index) in panelStoreRefs.routine.value
                  .routineToTimer"
                :key="t.timer.timerId"
                class="q-pa-none row no-wrap"
              >
                <q-card
                  bordered
                  class="flat no-shadow"
                  style="border-color: black; width: 130px; height: 98px"
                >
                  <q-card-section
                    class="q-pa-none"
                    style="height: 20px"
                    :style="colorExtractor(t.timer)"
                  >
                  </q-card-section>
                  <q-card-section
                    v-show="'timer' in t"
                    class="q-img-container"
                    style="background-color: #fefefe"
                    :style="
                      index === panelStoreRefs.round.value
                        ? highlightBorder(t.timer)
                        : index < panelStoreRefs.round.value
                        ? notCurrent(t.timer)
                        : null
                    "
                  >
                    {{ t.timer.name }}<br />
                    <q-icon name="timer" />
                    {{ timeFormatter(t.timer.duration).value }}<br />
                    <div
                      :style="
                        index === panelStoreRefs.round.value
                          ? shadeByTime(t.timer)
                          : null
                      "
                    ></div>
                  </q-card-section>
                </q-card>

                <!--                Arrow drawer-->
                <div class="row items-center">
                  <q-icon
                    v-if="arrowDrawer(index)"
                    name="arrow_right"
                    style="font-size: 4rem; color: grey"
                  ></q-icon>
                </div>
              </div>
            </div>

            <!--        Timer Mode-->
            <div
              v-else-if="panelStore.mode === 'timer'"
              class="row justify-center no-wrap"
              style="height: 100%; white-space: nowrap"
            >
              <!--            TODO: width 단위 수정-->
              <div class="q-pa-none row no-wrap">
                <q-card
                  bordered
                  class="flat no-shadow"
                  style="border-color: black; width: 130px"
                  flat
                >
                  <q-card-section
                    class="q-pa-none"
                    style="height: 20px"
                    :style="colorExtractor(panelStore.timer)"
                  >
                  </q-card-section>
                  <q-card-section
                    class="card"
                    style="background-color: #fefefe"
                    :style="highlightBorder(panelStore.timer)"
                  >
                    {{ panelStore.timer.name }}<br />
                    <q-icon name="timer" />
                    {{ timeFormatter(panelStore.timer.duration).value }}<br />
                    <div :style="shadeByTime(panelStore.timer)"></div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-scroll-area>
  </div>
  <div v-else class="row justify-center items-center text-h6">
    우측의 타이머 혹은 하단의 루틴에서 설정하고자 하는 항목을 더블클릭 하세요.
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import _ from 'lodash-es';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { usePanelStore } from 'src/core/panel/infra/store/panel.store';
import { useRoutineStore } from 'src/core/routines/infra/store/routine.store';
import { ITimer } from 'src/core/timers/domain/timer.model';
import { useTimerStore } from 'src/core/timers/infra/store/timer.store';
import { isEmptyObj } from 'src/util/is-empty-object.util';
import { computed, onUpdated } from 'vue';

dayjs.extend(duration);
dayjs.extend(relativeTime);

const $q = useQuasar();

const panelStore = usePanelStore();
const routineStore = useRoutineStore();
const timerStore = useTimerStore();

const panelStoreRefs = storeToRefs(panelStore);

onUpdated(() => {
  if (panelStoreRefs.mode.value === 'routine') {
    const timer = panelStore.backupRoutine;
    panelStore.originDur = !!timer.routineToTimer.length
      ? timer.routineToTimer[panelStore.round].timer.duration
      : 0;
  } else if (panelStoreRefs.mode.value === 'timer') {
    const timer = panelStore.backupTimer;
    panelStore.originDur = timer.duration;
  }
});

const arrowDrawer = (index: number) => {
  return (
    !!panelStoreRefs.routine.value &&
    index !== panelStoreRefs.routine.value.routineToTimer.length - 1
  );
};

const timeFormatter = (duration: string | number) => {
  return computed(() => {
    return dayjs.duration(+duration, 'seconds').format('HH:mm:ss');
  });
};

const highlightBorder = (timer: ITimer) => {
  return {
    // borderBottom: 'solid DodgerBlue 0.3rem',
  };
};

const notCurrent = (timer: ITimer) => {
  return {
    height: '79px',
    backgroundColor: 'grey',
  };
};

const colorExtractor = (timer: ITimer) => {
  return {
    background: timer.color,
  };
};

const shadeByTime = (timer: ITimer) => {
  let progressRatio =
    100 - (panelStore.getCurrentDuration / panelStore.originDur) * 100;

  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${progressRatio}%`,
    transition: 'width 0.3s linear',
    height: '100%',
    backgroundColor: 'black',
    opacity: '0.5',
  };
};
</script>
