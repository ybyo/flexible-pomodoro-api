<template>
  <div class="row fit justify-center content-start">
    <div id="clock">
      <div class="time">{{ formattedCurrentTime.value }}</div>
    </div>

    <q-space class="flex-break"></q-space>

    <div class="row flex q-my-none">
      <div>
        <q-toggle
          v-model="endless"
          icon="all_inclusive"
          class="q-pr-sm"
          color="orange-6"
        />
        <q-tooltip anchor="top middle" self="top middle">
          <div>
            반복 모드를 활성화 합니다. 루틴이 끝까지 도달해도 처음으로
            되돌아갑니다.
          </div>
        </q-tooltip>
      </div>
      <div>
        <q-toggle
          v-model="autoStart"
          icon="check"
          color="purple-6"
          class="q-pr-sm"
        />
        <q-tooltip anchor="top middle" self="top middle">
          <div>
            자동 시작 모드를 활성화 합니다. 데스크톱 알림에 응답하지 않아도
            자동으로 다음 타이머가 실행됩니다.
          </div>
        </q-tooltip>
      </div>
      <div>
        <q-toggle
          v-model="notification"
          icon="notifications_active"
          color="teal-6"
        />
        <q-tooltip anchor="top middle" self="top middle">
          <div>데스크톱 알림을 활성화 합니다.</div>
        </q-tooltip>
      </div>
    </div>

    <q-space class="flex-break"></q-space>

    <div class="row justify-center col-3 no-wrap text-no-wrap q-my-md">
      <q-btn
        v-if="panelStore.state !== 'start'"
        color="green-7"
        text-color="white"
        @click="start"
        >start
      </q-btn>
      <q-btn
        v-else-if="panelStore.state === 'start'"
        color="yellow"
        text-color="black"
        @click="pause"
        >pause
      </q-btn>
      <q-btn class="q-ml-lg" color="blue" text-color="white" @click="skip"
        >skip
      </q-btn>
      <q-btn class="q-ml-lg" color="red" text-color="white" @click="stop"
        >stop
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import _ from 'lodash-es';
import { storeToRefs } from 'pinia';
import { useMeta, useQuasar } from 'quasar';
import { usePanelStore } from 'src/core/panel/infra/store/panel.store';
import { IRoutine } from 'src/core/routines/domain/routine.model';
import { useRoutineStore } from 'src/core/routines/infra/store/routine.store';
import { ITimer } from 'src/core/timers/domain/timer.model';
import { useTimerStore } from 'src/core/timers/infra/store/timer.store';
import {
  computed,
  onBeforeMount,
  onMounted,
  onUnmounted,
  onUpdated,
  ref,
  watch,
  watchEffect,
} from 'vue';
import {onBeforeRouteLeave} from 'vue-router';

const $q = useQuasar();

const panelStore = usePanelStore();
const routineStore = useRoutineStore();
const timerStore = useTimerStore();

const panelStoreRefs = storeToRefs(panelStore);

let round = panelStoreRefs.round;
let timer = {} as ITimer | null;
const dts = Math.floor(Date.now());

const notificationOptions: NotificationOptions = {
  renotify: true,
  requireInteraction: true,
  tag: 'pipe_timer',
  vibrate: [200, 200],
  timestamp: dts,
};

const endless = ref(panelStore.endless);
const autoStart = ref(panelStore.autoStart);
const notification = ref(panelStore.notification);

watchEffect(() => {
  panelStore.endless = endless.value;
  panelStore.autoStart = autoStart.value;
  panelStore.notification = notification.value;
});

onBeforeMount(() => {
  if (panelStore.intervalId !== undefined) {
    clearInterval(panelStore.intervalId);
  }
  if (panelStore.state === 'start') {
    start();
  }
});

onBeforeRouteLeave(() => {
  for (let i = 1; i < 99999; i++) {
    clearInterval(i);
  }
});

const currDuration = computed(() => {
  if (panelStore.mode === 'routine') {
    const data = panelStore.routine;
    if (
      data.routineToTimer[round.value] &&
      'timer' in data.routineToTimer[round.value]
    ) {
      return data.routineToTimer[round.value].timer.duration;
    } else {
      return 0;
    }
  } else if (panelStore.mode === 'timer') {
    return panelStore.timer.duration < 0 ? 0 : panelStore.timer.duration;
  }

  return 0;
});

const timeFormatter = (duration: number) =>
  computed(() => {
    const time = duration !== undefined && duration >= 0 ? duration : 0;

    return dayjs.duration(time, 'seconds').format('HH:mm:ss');
  });

const formattedCurrentTime = computed(() => {
  return timeFormatter(currDuration.value);
});

const start = () => {
  if ('routineToTimer' in panelStore.routine || 'timerId' in panelStore.timer) {
    panelStore.intervalId = setInterval(elapse, 1000);
  } else {
    $q.notify({
      color: 'warning',
      message: '우선 작동 시킬 타이머 혹은 루틴을 더블클릭하여 셋팅해주세요.',
      textColor: 'black',
    });

    clearInterval(panelStore.intervalId);
  }
};

const pause = () => {
  // TODO: 시간 정보 출력 부분이 깜빡이는 트랜지션 추가
  if (panelStore.state === 'pause') return;
  panelStore.state = 'pause';

  clearInterval(panelStore.intervalId);
};

const skip = () => {
  if (panelStore.round < panelStore.routine.routineToTimer.length - 1) {
    panelStore.round = panelStore.round + 1;
  } else {
    panelStore.round = 0;
  }

  loadBackupTimer();
  panelStore.state = 'pause';
  clearInterval(panelStore.intervalId);
};

const stop = () => {
  if (panelStore.state === 'stop') return;
  loadBackupTimer();

  panelStore.state = 'stop';
  panelStore.round = 0;

  clearInterval(panelStore.intervalId);
  useMeta({ title: 'Pipe Timer' });
};

onUpdated(() => {
  useMeta({ title: `${formattedCurrentTime.value.value}` });
});

const elapse = () => {
  panelStore.state = 'start';

  if (panelStore.mode === 'routine') {
    timer = _.cloneDeep(panelStore.routine.routineToTimer[round.value].timer);
    timer.duration--;
    panelStore.routine.routineToTimer[round.value].timer = _.cloneDeep(timer);
  } else if (panelStore.mode === 'timer') {
    timer = _.cloneDeep(panelStore.timer);
    timer.duration--;
    panelStore.timer = _.cloneDeep(timer);
  }
  if (timer !== null && timer.duration < 0) {
    if (!!notification.value) {
      clearInterval(panelStore.intervalId);
      notifyRoundEnd();
    }
    panelStore.round++;
    timeEnd();
  }
};

const loadBackupTimer = () => {
  let data;
  if (panelStore.mode === 'routine') {
    data = _.cloneDeep(panelStore.backupRoutine);
    panelStore.routine = _.cloneDeep(data);
    panelStore.timer = _.cloneDeep({} as ITimer);
    const id = data.id;
    routineStore.routine[id] = data;
  } else if (panelStore.mode === 'timer') {
    data = _.cloneDeep(panelStore.backupTimer);
    panelStore.timer = _.cloneDeep(data);
    panelStore.routine = _.cloneDeep({} as IRoutine);
    const id = data.timerId;
    timerStore.timers[id] = data;
  }
};

const setNotification = () => {
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
};

watch(endless, () => {
  if (endless.value === true) {
    $q.notify({
      html: true,
      message:
        '무제한 모드를 활성화합니다.<br>설정된 루틴, 타이머가 STOP 버튼을 누를 때 까지 계속해서 반복 작동합니다',
    });
  }

  if (endless.value === false) {
    $q.notify({
      html: true,
      message: '무제한 모드를 비활성화합니다',
    });
  }
});

watch([notification, Notification.permission], () => {
  if (notification.value === true) {
    setNotification();
    if (Notification.permission === 'granted') {
      new Notification('Pipe Timer', {
        ...notificationOptions,
        body: '데스크톱 푸시 알림 설정을 활성화합니다.\n타이머 종료 시, 데스크톱 알림을 전송합니다.',
      });
    }
  }
  if (notification.value === false) {
    $q.notify({
      message: '데스크톱 푸시 알림을 비활성화 합니다.',
    });
  }
});

watch(autoStart, () => {
  if (autoStart.value === true) {
    $q.notify({
      html: true,
      message:
        '자동 시작 기능을 활성화합니다.<br>라운드 종료 시, 다음 라운드를 자동으로 실행합니다.',
    });
  }

  if (autoStart.value === false) {
    $q.notify({
      message: '자동 시작 기능을 비활성화합니다.',
    });
  }
});

const notifyRoundEnd = () => {
  let name = '';
  let duration = 0;
  let nextRound = round.value + 1;

  if (panelStore.mode === 'routine') {
    const routineToTimerLength = panelStore.routine.routineToTimer.length;
    if (nextRound < routineToTimerLength) {
      const timer = panelStore.routine.routineToTimer[nextRound].timer;
      name = timer.name;
      duration = timer.duration;
    } else if (nextRound === routineToTimerLength) {
      nextRound = 0;
      const timer = panelStore.routine.routineToTimer[nextRound].timer;
      name = timer.name;
      duration = timer.duration;
    }
  } else if (panelStore.mode === 'timer') {
    const id = panelStore.timer.timerId;
    const timer = timerStore.timers[id];
    name = timer.name;
    duration = timer.duration;
  }

  let nextTimerInfo = `타이머 이름: ${name}\n시간: ${
    timeFormatter(duration).value
  }`;

  if (autoStart.value) {
    new Notification('Pipe Timer', {
      ...notificationOptions,
      body: `다음 타이머를 실행합니다.\n${nextTimerInfo}`,
    });
    panelStore.intervalId = setInterval(elapse, 1000);
  } else {
    const routineToTimerLength = panelStore.routine.routineToTimer.length;
    if (
      !(panelStore.mode === 'routine' && round.value > routineToTimerLength)
    ) {
      endRoundPush(nextTimerInfo);
    }
  }
};

const timeEnd = () => {
  if (
    panelStore.mode === 'routine' &&
    +round.value >= +panelStore.routine.routineToTimer.length
  ) {
    if (endless.value === true) {
      round.value = 0;
    } else {
      clearInterval(panelStore.intervalId);

      panelStoreRefs.state = ref('');
      panelStoreRefs.round = ref(0);

      $q.notify({ message: '타이머를 종료합니다', color: 'green' });
      stop();
    }
  } else if (panelStore.mode === 'timer' && +round.value >= 1) {
    if (endless.value === true) {
      round.value = 0;
    } else {
      clearInterval(panelStore.intervalId);

      panelStore.state = '';
      panelStore.round = 0;

      $q.notify({ message: '타이머를 종료합니다', color: 'green' });
      stop();
    }
  }
  loadBackupTimer();
};

const endRoundPush = (timerInfo: any) => {
  panelStore.state = 'pause';

  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      if (
        panelStore.mode === 'routine' &&
        round.value < panelStore.routine.routineToTimer.length
      ) {
        panelStore.state = 'pause';
        registration.showNotification('Pipe Timer', {
          ...notificationOptions,
          body: `다음 타이머를 실행하시겠습니까?\n${timerInfo}`,
          actions: [
            {
              title: 'Confirm',
              action: 'confirm',
            },
            {
              title: 'Cancel',
              action: 'close',
            },
          ],
        });
      } else if (
        (panelStore.mode === 'routine' &&
          round.value === panelStore.routine.routineToTimer.length) ||
        panelStore.mode === 'timer'
      ) {
        new Notification('모든 타이머를 실행했습니다.');
        stop();
      }
    });
  }
};

onMounted(() => {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data === 'confirm') {
        panelStore.intervalId = setInterval(elapse, 1000);
      }
    });
  }
});

// Shortcut

document.onkeydown = function (e) {
  const dialogBackdrop = document.querySelector(
    '.q-dialog__backdrop.fixed-full'
  );
  if (dialogBackdrop !== null) return;

  if (e.key === ' ') {
    if (panelStore.state === 'pause') start();
    else if (panelStore.state === 'start') pause();
  }
};
</script>

<style lang="scss" scoped>
.flex-break {
  flex: 1 0 100% !important;
  height: 0;
  margin: 0;
  border: 0;
}

$color: black;
$color-light: white;

@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');

#clock {
  order: 0;

  .time {
    font-family: 'Share Tech Mono', sans-serif;
    font-size: 3rem;
  }
}
</style>
