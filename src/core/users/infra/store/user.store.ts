import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';
import { IUser } from 'src/type-defs/userTypes';

interface UserState {
  user: IUser | null;
  verifiedEmail: string | null;
  resetPasswordPrompt: boolean;
}

export const useUserStore = defineStore('userStore', {
  state: (): UserState => ({
    user: null,
    verifiedEmail: '',
    resetPasswordPrompt: false,
  }),
  persist: {
    key: 'user-data',
    storage: {
      getItem: (key) => {
        return LocalStorage.getItem(key);
      },
      setItem: (key, value) => {
        return LocalStorage.set(key, value);
      },
    },
    beforeRestore: (ctx) => {
      // TODO: 로그인 무결성 검사 추가
    },
  },
  getters: {},
  actions: {
    setUser(user: IUser | null) {
      this.user = user;
    },
  },
});
