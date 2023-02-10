import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';
import { IUser } from 'src/type-defs/userTypes';

interface UserState {
  user: IUser | null;
  verifiedEmail: string | null;
}

export const useUserStore = defineStore('userStore', {
  state: (): UserState => ({
    user: null,
    verifiedEmail: '',
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
      console.log(`about to restore '${ctx.store.$id}'`);
    },
  },
  getters: {},
  actions: {
    setUser(user: IUser | null) {
      this.user = user;
    },
  },
});
