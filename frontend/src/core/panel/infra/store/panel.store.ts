import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';
import { IRoutine } from 'src/core/routines/domain/routine.model';
import { ITimer } from 'src/core/timers/domain/timer.model';

export interface PanelState {
  timer: ITimer;
  routine: IRoutine;
  mode: string; // 'routine', 'timer', ''
  state: string; // 'start', 'pause', 'stop', ''
  round: number;
  originDur: number;
  amount: number;
  endless: boolean;
  autoStart: boolean;
  notification: boolean;
  intervalId: string | number | NodeJS.Timeout | undefined;
  backupTimer: ITimer;
  backupRoutine: IRoutine;
}

export const usePanelStore = defineStore('PanelStore', {
  state: (): PanelState => {
    return {
      timer: {} as ITimer,
      routine: {} as IRoutine,
      mode: '',
      state: '',
      round: 0,
      amount: 0,
      originDur: 0,
      endless: false,
      autoStart: false,
      notification: false,
      intervalId: undefined,
      backupTimer: {} as ITimer,
      backupRoutine: {} as IRoutine,
    };
  },
  persist: {
    key: 'panel-data',
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
    // TODO: 비동기 타이머 기능 추가(다수의 타이머를 개별적으로 실행시킴)
    getTotalDuration(): number {
      let total = 0;
      if (this.mode === 'routine') {
        this.routine.routineToTimer.forEach((e) => {
          total += e.timer.duration;
        });
      } else {
        total = this.timer.duration;
      }
      return total;
    },

    getCurrentDuration(): number {
      const currentRound = this.round;
      let duration = 0;

      if (this.mode === 'routine') {
        duration = this.routine.routineToTimer[currentRound].timer.duration;
      } else {
        duration = this.timer.duration;
      }

      return duration !== undefined ? duration : 0;
    },
  },
  actions: {},
});
