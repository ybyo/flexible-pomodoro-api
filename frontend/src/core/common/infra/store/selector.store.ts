import { defineStore } from 'pinia';

export interface IEditNow {
  onRoutine: boolean;
  onBuilder: boolean;
  onTimer: boolean;
  editNow: string;
  removeRoutine: boolean;
}

export const useSelectorStore = defineStore('SelectorStore', {
  state: (): IEditNow => {
    return {
      onRoutine: false,
      onBuilder: false,
      onTimer: false,
      editNow: '',
      removeRoutine: false,
    };
  },
});
