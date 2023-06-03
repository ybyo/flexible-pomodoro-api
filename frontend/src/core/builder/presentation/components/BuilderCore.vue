<template>
  <q-item class="row fit justify-between q-pa-none q-ma-none">
    <q-item-section class="row justify-between">
      <div
        v-if="isEditBuilder"
        class="text-subtitle1"
        style="position: absolute; width: 100%"
      >
        <div
          class="row justify-between"
          style="background-color: #007777; color: white"
        >
          <div class="row justify-between">
            <div class="q-ml-sm">{{ props.routine.name }}</div>
            <div>
              <q-btn
                v-show="!isEmptyObj(routineInBuilder)"
                icon="edit"
                dense
                flat
                size="sm"
                @click="editRoutineBtn"
                class="q-pl-sm"
                style="position: relative; bottom: 2px"
              />
            </div>
          </div>
          <div class="q-mx-sm fixed-right">Total - {{ totalDuration }}</div>
        </div>
        <div
          v-if="!routineInBuilder.routineToTimer.length"
          class="text-h6 text-weight-bold q-ml-sm"
        >
          우측 타이머 영역에서 추가하려는 타이머를 이곳에 드래그해주세요.
        </div>
      </div>

      <q-space v-if="!routineInBuilder.routineToTimer.length" class="q-my-lg" />

      <draggable
        v-if="'routineToTimer' in props.routine"
        v-bind="dragOptions"
        :list="rBuilder"
        :component-data="{
          tag: 'ul',
          type: 'transition-group',
          name: !drag ? 'flip-list' : null,
        }"
        class="q-my-lg q-mx-md row no-wrap builder-group"
        @start="drag = true"
        @end="drag = false"
        item-key="order timerId"
        :removeOnSpill="true"
        :onSpill="removeDraggedItem"
      >
        <template #item="{ element, index }">
          <div>
            <!--      Inner Builder-->
            <div
              class="row no-wrap flat justify-between"
              style="
                height: 6rem;
                white-space: nowrap;
                position: relative;
                bottom: -1rem;
              "
            >
              <q-card
                class="inner-my-card cursor-pointer flat justify-between no-shadow"
                bordered
                style="
                  background: transparent;
                  display: inline-block;
                  width: 130px;
                  height: 98px;
                  border-color: black;
                "
                :style="colorExtractor(element.timer)"
              >
                <q-card-section
                  class="q-pa-none"
                  style="height: 20px"
                  :style="colorExtractor(element.timer)"
                >
                </q-card-section>
                <q-card-section style="background-color: #fefefe">
                  {{ element.timer.name }}<br />
                  <q-icon name="timer" />
                  {{ timeFormatter(element.timer.duration).value }}
                </q-card-section>
              </q-card>
              <div class="row items-center">
                <q-icon
                  v-if="arrowDrawer(index)"
                  name="arrow_right"
                  style="font-size: 4rem; color: dimgrey"
                ></q-icon>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </q-item-section>
  </q-item>

  <!--  Edit routines prompt-->
  <q-dialog v-model="editRoutinePrompt" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">새로운 루틴 이름</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          dense
          v-model="routineName"
          autofocus
          @keyup.enter.prevent="editRoutine"
          @keyup.esc.prevent="editRoutinePrompt = false"
        />
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="취소" v-close-popup @click="cancelEdit" />
        <q-btn
          flat
          label="확인"
          color="green"
          v-close-popup
          @click="editRoutine"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { LocalStorage } from 'quasar';
import { useBuilderStore } from 'src/core/builder/infra/store/builder.store';
import { IRoutine } from 'src/core/routines/domain/routine.model';
import { ITimer } from 'src/core/timers/domain/timer.model';
import { isEmptyObj } from 'src/util/is-empty-object.util';
import { computed, reactive, ref } from 'vue';
import _ from 'lodash';
import draggable from 'vuedraggable';

const builderStore = useBuilderStore();
const { getTotalDur, isEditBuilder, routineInBuilder } =
  storeToRefs(builderStore);
const editRoutinePrompt = ref(false);

const props = defineProps<{ routine: IRoutine }>();
const rBuilder = computed(() => {
  return reactive(props.routine.routineToTimer);
});

const routineName = ref('');
const drag = ref(false);

const arrowDrawer = (index: number) => {
  return !!props.routine && index !== props.routine.routineToTimer.length - 1;
};

const removeDraggedItem = (e: any) => {
  builderStore.routineInBuilder.routineToTimer.splice(e.oldIndex, 1);
};

const timeFormatter = (duration: string | number) => {
  return computed(() => {
    return dayjs.duration(+duration, 'seconds').format('HH:mm:ss');
  });
};

const totalDuration = computed(() => {
  const formatted = dayjs
    .duration(getTotalDur.value, 'seconds')
    .format('HH:mm:ss');
  return formatted;
});

const editRoutineBtn = () => {
  editRoutinePrompt.value = true;
};

const editRoutine = () => {
  builderStore.routineInBuilder.name = routineName.value;
  editRoutinePrompt.value = false;
};

const cancelEdit = () => {
  const backup = LocalStorage.getItem('builder-backup') as IRoutine;
  if (!!backup) {
    builderStore.routineInBuilder = backup;
    LocalStorage.set('builder-backup', {});
  }
};

const dragOptions = {
  animation: 200,
  group: { name: 'timers' },
  disabled: false,
  ghostClass: 'ghost',
};

const colorExtractor = (timer: ITimer) => {
  return {
    background: timer.color,
  };
};
</script>

<style lang="scss" scoped>
.flip-list-move {
  transition: transform 0.5s;
}

.inner-my-card {
  width: 10rem;
}

.q-img-container {
  position: relative;
}
.arrow-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.flex-break {
  flex: 1 0 100% !important;
}
.row {
  .flex-break {
    height: 0 !important;
  }
}
.column {
  .flex-break {
    width: 0 !important;
  }
}
</style>
