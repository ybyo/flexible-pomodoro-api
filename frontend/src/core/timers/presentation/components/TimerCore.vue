<!--TODO: Font 컬러 설정 추가-->
<template>
  <!--  TODO: rTimer가 undefined일 경우 에러 문구 표시-->
  <draggable
    class="q-pt-sx"
    :list="rTimers"
    item-key="order"
    :group="{ name: 'timers', pull: clone, put: false }"
    v-bind="dragOptions"
    @start="drag = true"
    @end="computeInitIdx"
    :clone="timerWrapper"
    :move="orderTimer"
  >
    <template #item="{ element, index }">
      <div class="row justify-between">
        <q-space />
        <div class="q-py-sm">
          <q-card
            class="cursor-pointer no-shadow q-ma-none"
            style="width: 130px; border-color: black"
            bordered
            v-ripple
            @dblclick="toPanel(element)"
          >
            <q-menu touch-position context-menu :disable="isEdit">
              <q-list dense style="min-width: 100px">
                <q-item
                  clickable
                  v-close-popup
                  @click="editTimer(element)"
                  :disable="
                    isEdit ||
                    panelStore.state === 'start' ||
                    panelStore.state === 'pause'
                  "
                >
                  <q-item-section>수정</q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  clickable
                  v-close-popup
                  @click="remove(index)"
                  :disable="
                    isEdit ||
                    panelStore.state === 'start' ||
                    panelStore.state === 'pause'
                  "
                >
                  <q-item-section style="color: #8b1c00">삭제</q-item-section>
                </q-item>
              </q-list>
              <q-tooltip v-if="isEdit" anchor="top middle" self="top middle">
                루틴 생성 및 수정 시, 타이머 삭제 및 수정이 불가능합니다.
              </q-tooltip>
              <q-tooltip
                v-if="
                  panelStore.state === 'start' || panelStore.state === 'pause'
                "
                anchor="top middle"
                self="top middle"
              >
                타이머 혹은 루틴 작동 중엔 삭제가 불가능 합니다.<br />'Stop'을
                눌러 완전히 정지한 후 진행해 주세요.
              </q-tooltip>
            </q-menu>
            <q-card-section
              class="q-pa-none"
              style="height: 20px"
              :style="colorExtractor(element)"
            >
            </q-card-section>

            <q-card-section style="background-color: #fefefe">
              {{ element.name }} <br />
              <q-icon name="timer" />
              {{ timeFormatter(element.duration).value }}
            </q-card-section>
          </q-card>
        </div>
        <q-space />

        <q-dialog v-model="editPrompt" persistent>
          <q-card style="min-width: 350px">
            <q-card-section>
              <div class="text-h6">Edit timer</div>
            </q-card-section>

            <!--            Edit timers prompt-->
            <q-card-section class="q-pt-none">
              <q-input
                label="Name"
                v-model="timerName"
                hint="타이머의 이름을 입력해주세요."
                dense
                autofocus
                debounce="300"
                @keydown.enter="update"
                @keydown.esc="editPrompt = false"
                :error="!!nameError"
                :error-message="nameError"
              />
              <!--        TODO: 입력값 검증 수행하기-->
              <div class="row justify-start q-gutter-lg">
                <q-input
                  hide-bottom-space
                  label="Hour"
                  v-model="hours"
                  dense
                  autofocus
                  debounce="300"
                  :input-style="{ width: '4rem' }"
                  :error="!!hoursError"
                  :error-message="hoursError"
                />
                <q-input
                  hide-bottom-space
                  label="Minutes"
                  v-model="minutes"
                  dense
                  autofocus
                  debounce="300"
                  :input-style="{ width: '4rem' }"
                  :error="!!minutesError"
                  :error-message="minutesError"
                />
                <q-input
                  hide-bottom-space
                  label="Seconds"
                  v-model="seconds"
                  dense
                  autofocus
                  debounce="300"
                  :input-style="{ width: '4rem' }"
                  :error="!!secondsError"
                  :error-message="secondsError"
                />
              </div>

              <q-input
                v-model="color"
                :rules="['anyColor']"
                hint="타이머 구분에 사용할 색상을 선택합니다."
                debounce="300"
                :error="!!colorError"
                :error-message="colorError"
              >
                <template v-slot:append>
                  <q-icon name="colorize" class="cursor-pointer">
                    <q-popup-proxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-color
                        v-model="color"
                        no-header-tabs
                        format-model="hexa"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </q-card-section>

            <q-card-actions align="right" class="text-primary">
              <q-btn
                flat
                type="submit"
                label="Cancel"
                v-close-popup
                @click="cancel"
              />
              <q-btn
                flat
                label="Confirm"
                color="green"
                type="submit"
                @click="onSubmit"
                :disable="!isEmptyObj(errors)"
                v-close-popup
              />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>
    </template>
  </draggable>
</template>

<script setup lang="ts">
import { toFormValidator } from '@vee-validate/zod';
import dayjs from 'dayjs';
import _ from 'lodash-es';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useBuilderStore } from 'src/core/builder/infra/store/builder.store';
import { usePanelStore } from 'src/core/panel/infra/store/panel.store';
import { useRoutineStore } from 'src/core/routines/infra/store/routine.store';
import { IRoutineToTimer, ITimer } from 'src/core/timers/domain/timer.model';
import { useTimerStore } from 'src/core/timers/infra/store/timer.store';
import { saveTimerFn } from 'src/core/users/infra/http/user.api';
import { useUserStore } from 'src/core/users/infra/store/user.store';
import { isEmptyObj } from 'src/util/is-empty-object.util';
import { useField, useForm } from 'vee-validate';
import { computed, ref } from 'vue';
import draggable from 'vuedraggable';
import * as zod from 'zod';

const timerStore = useTimerStore();
const panelStore = usePanelStore();
const routineStore = useRoutineStore();
const userStore = useUserStore();
const builderStore = useBuilderStore();

const builderStoreRefs = storeToRefs(builderStore);
const timerStoreRefs = storeToRefs(timerStore);

let rTimers = timerStoreRefs.listTimers;

const $q = useQuasar();

const isEdit = computed(() => {
  return builderStoreRefs.isEditBuilder.value;
});

const props = defineProps<{ timers: ITimer[] }>();
const emit = defineEmits<{
  (e: 'remove', id: string): void;
  (e: 'removeLocal', id: string): void;
}>();

const drag = ref(false);
const timerId = ref('');
const duration = ref(0);
const order = ref(0);
const isEditing = ref(false);
const editPrompt = ref(false);

const editTimerSchema = toFormValidator(
  zod
    .object({
      timerName: zod.string().min(1, '최소 1글자 이상으로 설정해주세요.'),
      hours: zod.coerce
        .number()
        .min(0, '최소 0 이상으로 설정해주세요.')
        .max(23, '최대 23 이하로 설정해주세요.'),
      minutes: zod.coerce
        .number()
        .min(0, '최소 0 이상으로 설정해주세요.')
        .max(59, '최대 59 이하로 설정해주세요.'),
      seconds: zod.coerce
        .number()
        .min(0, '최소 0 이상으로 설정해주세요.')
        .max(59, '최대 59 이하로 설정해주세요.'),
      color: zod
        .string()
        .startsWith('#')
        .max(9)
        .regex(
          /^#[0-9A-Fa-f]{8}$/,
          '색상값 형태가 잘못되었습니다. 우측의 Colorize 아이콘을 활용해주세요.'
        ),
    })
    .refine((data) => +data.hours + +data.minutes + +data.seconds > 0, {
      path: ['seconds'],
      message: '총 시간은 최소 1초 이상으로 설정되어야 합니다.',
    })
);

const { handleSubmit, resetForm, errors } = useForm({
  validationSchema: editTimerSchema,
});

const { value: timerName, errorMessage: nameError } =
  useField<string>('timerName');
const { value: hours, errorMessage: hoursError } = useField<number>('hours');
const { value: minutes, errorMessage: minutesError } =
  useField<number>('minutes');
const { value: seconds, errorMessage: secondsError } =
  useField<number>('seconds');
const { value: color, errorMessage: colorError } = useField<string>('color');

const remove = (index: number) => {
  const relatedRoutineIds = findRelatedRoutine(index);
  const relatedRoutineNames: string[] = [];

  relatedRoutineIds.forEach((id: string) => {
    relatedRoutineNames.push(routineStore.routine[id].name);
  });

  if (relatedRoutineIds.length > 0) {
    if (!!userStore.user) {
      $q.notify({
        progress: true,
        icon: 'warning',
        html: true,
        message: `삭제하려는 타이머는 ${relatedRoutineNames} 루틴에 포함되어 있습니다.<br>삭제를 진행할 경우 관련된 루틴에서 타이머가 삭제됩니다.<br>계속하시겠습니까?`,
        actions: [
          {
            label: '확인',
            color: 'negative',
            handler: () => {
              timerStoreRefs.isLoadingTimer.value = false;
              emit('remove', props.timers[index].timerId);
            },
          },
          { label: '취소', color: 'white' },
        ],
      });
    } else {
      $q.notify({
        progress: true,
        icon: 'warning',
        html: true,
        message: `삭제하려는 타이머는 ${relatedRoutineNames} 루틴에 포함되어 있습니다.<br>삭제를 진행할 경우 관련된 루틴에서 제외됩니다(루틴은 삭제되지 않음).<br>계속하시겠습니까?`,
        actions: [
          {
            label: '확인',
            color: 'negative',
            handler: () => {
              timerStoreRefs.isLoadingTimer.value = false;
              emit('removeLocal', props.timers[index].timerId);
            },
          },
          { label: '취소', color: 'white' },
        ],
      });
    }
  } else {
    $q.notify({
      progress: true,
      message: '타이머를 삭제하시겠습니까?',
      actions: [
        {
          label: '확인',
          color: 'negative',
          handler: () => {
            timerStoreRefs.isLoadingTimer.value = false;
            emit('remove', props.timers[index].timerId);
          },
        },
        { label: '취소', color: 'white' },
      ],
    });
  }
};

const findRelatedRoutine = (index: number): string[] => {
  const timerId = props.timers[index].timerId;
  const routineList = routineStore.listRoutine;
  const result: string[] = [];

  routineList.forEach((routine) => {
    routine.routineToTimer.filter((timer) => timer.timer.timerId !== timerId);
    result.push(routine.id);
  });

  return result;
};

const cancel = () => {
  timerName.value = '';
  hours.value = 0;
  minutes.value = 0;
  seconds.value = 0;
  color.value = '#000000ff';

  resetForm({
    values: {
      timerName: '',
      hours: 0,
      minutes: 0,
      seconds: 0,
      color: '#000000ff',
    },
  });

  editPrompt.value = false;
};

const clone = (e: any) => {
  e.draggedContext.duration = 10;
  return e;
};

const timerWrapper = (e: any) => {
  const routineToTimer: IRoutineToTimer = {
    routineToTimerId: null,
    order: 0,
    timer: e as ITimer,
  };
  drag.value = false;
  return routineToTimer;
};

const timeFormatter = (duration: string | number) => {
  return computed(() => {
    return dayjs.duration(+duration, 'seconds').format('HH:mm:ss');
  });
};

const update = () => {
  const newTimer = {} as ITimer;

  newTimer.timerId = timerId.value;
  newTimer.name = timerName.value;
  newTimer.duration =
    +hours.value * 3600 + +minutes.value * 60 + +seconds.value;
  newTimer.color = color.value;
  newTimer.order = order.value;
  newTimer.isEditing = isEditing.value;

  timerStore.edit(newTimer);
  editPrompt.value = false;

  saveTimerFn(timerStore.listTimers);
};

const editTimer = (timer: ITimer) => {
  editPrompt.value = true;

  const totalDuration = timer.duration;

  hours.value = dayjs.duration(totalDuration, 'seconds').hours();
  minutes.value = dayjs.duration(totalDuration, 'seconds').minutes();
  seconds.value = dayjs.duration(totalDuration, 'seconds').seconds();

  timerId.value = timer.timerId;
  timerName.value = timer.name;
  duration.value = +hours.value * 3600 + +minutes.value * 60 + +seconds.value;
  color.value = timer.color;
  order.value = timer.order;
  isEditing.value = timer.isEditing;
};

const orderTimer = (e: any) => {
  const timerId = e.draggedContext.element.timerId;
  timerStore.timers[timerId].order = e.draggedContext.element.order;
};

// TODO: 드래그와 동시에 order 계산하도록 구현
const computeInitIdx = (e: any) => {
  // window.console.log(e.newDraggableIndex);
  // const setIdx = (e: any) => {
  //   window.console.log(e.to);
  //   builderStore.routineInBuilder.routineToTimer[e.newDraggableIndex].timer.order =
  //     e.newDraggableIndex;
  // };
  // setIdx(e);

  drag.value = false;
};

// Panel related
const toPanel = (timer: ITimer) => {
  // Session storage for saving initial state of routines, timers
  try {
    // $q.sessionStorage.set('timers-data', timer);
    clearInterval(panelStore.intervalId);
    stop();

    panelStore.timer = _.cloneDeep(timer);
    panelStore.backupTimer = _.cloneDeep(timer);
    panelStore.mode = 'timer';
    panelStore.round = 0;
  } catch (e) {
    console.log(e);
  }
};

resetForm({
  values: {
    timerName: '새로운 타이머',
    hours: 0,
    minutes: 0,
    seconds: 0,
    color: '#000000ff',
  },
});

const onSubmit = handleSubmit(() => {
  update();
  resetForm({
    values: {
      timerName: '새로운 타이머',
      hours: 0,
      minutes: 0,
      seconds: 0,
      color: '#000000ff',
    },
  });
});

const colorExtractor = (timer: ITimer) => {
  return {
    background: timer.color,
  };
};

const dragOptions = {
  animation: 200,
  group: { name: 'timers', pull: 'clone', put: false },
  disabled: false,
  ghostClass: 'ghost',
};
</script>

<style lang="scss" scoped>
.my-input {
  max-width: 250px;
}
</style>

<!--TODO: Font 컬러 설정 추가, 입력값 필터링 추가-->
