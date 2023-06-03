import { api } from 'boot/axios';
import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';
import { Notify } from 'quasar';
import { IRoutine, Routine } from 'src/core/routines/domain/routine.model';
import { IRoutineToTimer } from 'src/core/timers/domain/timer.model';
import { useTimerStore } from 'src/core/timers/infra/store/timer.store';
import { isEmptyObj } from 'src/util/is-empty-object.util';

export interface BuilderState {
  routineInBuilder: IRoutine;
}

const timerStore = useTimerStore();

export const useBuilderStore = defineStore('BuilderStore', {
  state: (): BuilderState => {
    return {
      routineInBuilder: {} as IRoutine,
    };
  },
  persist: {
    key: 'builder-data',
    storage: {
      getItem: (key) => {
        return LocalStorage.getItem(key);
      },
      setItem: (key, value) => {
        return LocalStorage.set(key, value);
      },
    },
    beforeRestore: (ctx) => {
      // TODO: 데이터 무결성 검사 추가
    },
  },

  getters: {
    getTotalDur(): number {
      let total = 0;
      this.routineInBuilder.routineToTimer.forEach((e) => {
        total += e.timer.duration;
      });
      return total;
    },
    getBuilder(): IRoutine {
      return this.routineInBuilder;
    },

    getTimersInBuilder(): IRoutineToTimer[] {
      return this.routineInBuilder.routineToTimer;
    },
    isEditBuilder(): boolean {
      return !isEmptyObj(this.routineInBuilder);
    },
  },

  actions: {
    orderRoutine() {
      if ('routineToTimer' in this.routineInBuilder) {
        return this.routineInBuilder.routineToTimer.map((timer, index) => {
          timer.order = index;
          timer.timer.order = index;
        });
      }
    },

    async saveRoutine(routine: IRoutine) {
      // TODO: 상단에서 Initialize 하면 발생하는 오류 해결 -> ReferenceError: Cannot access 'useTimerStore' before initialization
      try {
        await timerStore.saveTimer();
      } catch {
        Notify.create({
          color: 'negative',
          message: '저장 과정에서 오류가 발생했습니다.',
        });
      }

      routine.routineToTimer.map((timer, index) => {
        timer.order = index;
      });

      const res = await api.post('routine/save', routine);
      if (res.data.success) {
        Notify.create({
          position: 'top',
          color: 'positive',
          message: '저장되었습니다',
        });
        // TODO: 저장 완료 후 fetch 통해서 RoutineList 다시 불러오도록 구현
      } else {
        Notify.create({
          position: 'top',
          color: 'negative',
          message: '오류가 발생했습니다. 인터넷 연결 상태를 확인해주세요.',
        });
      }
    },

    createRoutine(name: string) {
      // this.$reset();
      this.routineInBuilder = new Routine({ name: name });
    },
  },
});
