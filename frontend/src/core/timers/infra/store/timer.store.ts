import { api } from 'boot/axios';
import _ from 'lodash-es';
import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';
import { Notify } from 'quasar';
import { useSelectorStore } from 'src/core/common/infra/store/selector.store';
import { usePanelStore } from 'src/core/panel/infra/store/panel.store';
import { ITimer } from 'src/core/timers/domain/timer.model';
import { useUserStore } from 'src/core/users/infra/store/user.store';

export interface TimerState {
  timers: Record<string, ITimer>;
  timerIds: string[];
  isLoadingTimer: boolean;
}

export const useTimerStore = defineStore('TimerStore', {
  state: (): TimerState => {
    return {
      timers: {},
      timerIds: [],
      isLoadingTimer: false,
    };
  },
  persist: {
    key: 'timers-data',
    storage: {
      getItem: (key) => {
        return LocalStorage.getItem(key);
      },
      setItem: (key, value) => {
        return LocalStorage.set(key, value);
      },
    },
    beforeRestore: (ctx) => {
      // TODO: 타이머 무결성 검사 추가
    },
  },

  getters: {
    listTimersMap(): ITimer[] {
      return this.timerIds.map((i) => this.timers[i]);
    },

    listTimers(): ITimer[] {
      const result = [] as ITimer[];
      this.timerIds.forEach((e) => {
        result.push(this.timers[e]);
      });
      return result;
    },

    loadedTimers(): boolean {
      return this.timerIds.length > 0;
    },

    // isEditingTimers(): boolean {
    //   let filtered;
    //   if (!this.isLoadingTimer) {
    //     filtered = this.listTimersMap.find((obj) => {
    //       return obj.isEditing;
    //     });
    //   }
    //
    //   return filtered !== null;
    // },

    // canSaveTimers(): boolean {
    //   return !(this.isLoadingTimer || this.isEditingTimers);
    // },
  },

  // TODO: URL timer에서 timer로 변경
  actions: {
    async fetchAll() {
      const userStore = useUserStore();

      if (userStore.user !== null) {
        if (this.loadedTimers) this.$reset();
        this.isLoadingTimer = true;
        // TODO: 에러 처리 필요
        const res = await api.get('timer/fetch');

        const timers = res.data;
        this.isLoadingTimer = false;

        this.timerIds = timers.map((timer: ITimer) => {
          this.timers[timer.timerId] = timer;
          return timer.timerId;
        });
      }
    },

    add(newTimer: ITimer) {
      this.timers[newTimer.timerId] = newTimer;
      this.timerIds.push(newTimer.timerId);
    },

    edit(newTimer: ITimer) {
      this.timers[newTimer.timerId] = newTimer;
    },

    async remove(timerId: string) {
      const userStore = useUserStore();
      const panelStore = usePanelStore();

      const target = this.timers[timerId];

      if (!!target) {
        delete this.timers[timerId];

        if (timerId === panelStore.timer.timerId) {
          panelStore.timer = _.cloneDeep({} as ITimer);
        }
        const i = this.timerIds.lastIndexOf(timerId);
        if (i > -1) this.timerIds.splice(i, 1);
      }

      if (userStore.user !== null) {
        try {
          await this.saveTimer();
        } catch (err) {
          Notify.create({
            message: '타이머 삭제 중 오류가 발생했습니다.',
          });
        }
      }
    },

    updateList(newTimers: ITimer[]) {
      // update timers map
      const updatedTimers = {} as Record<string, ITimer>;
      newTimers.forEach((timer) => {
        updatedTimers[timer.timerId] = timer;
      });
      this.timers = updatedTimers;

      // update timers ids
      this.timerIds = newTimers.map((timer) => timer.timerId);
    },

    getInitState(): TimerState | null {
      return LocalStorage.getItem('timers');
    },

    reset() {
      this.$reset();
    },

    // toBuilder(timers: ITimer) {
    //   try {
    //     const builderStore = useBuilderStore();
    //     builderStore.routineInBuilder.routineToTimer.timer = timers;
    //   } catch (err) {
    //     console.log(err);
    //   }
    // },

    async saveTimer() {
      const selectorStore = useSelectorStore();
      const res = await api.post('timer/save', this.listTimers);

      if (!res) {
        Notify.create({
          message:
            '저장이 완료되지 않았습니다. 인터넷 연결 상태를 확인해주세요',
          color: 'negative',
        });
      } else {
        // TODO: Routine 저장 이후 자동으로 저장을 수행할 땐 Notify가 작동하지 않도록 수정
        // Notify.create({
        //   message: '저장을 완료했습니다.',
        //   color: 'positive',
        // });
        selectorStore.editNow = '';
      }
      // this.setInitialState();
    },
  },
});
