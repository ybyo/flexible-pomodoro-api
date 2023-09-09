import { defineStore } from 'pinia';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import { ulid } from 'ulid';
import { ref, watch } from 'vue';

import { useUserStore } from '../core/users/infra/store/user.store';

export const useSocketStore = defineStore('SocketStore', () => {
  let socket: Socket;
  const isStarted = ref(false);
  const timerData = ref(null);
  const userStore = useUserStore();

  const userId = userStore.user ? userStore.user.id : ulid();
  const userRole = userStore.user ? 'user' : 'guest';

  const initSocket = () => {
    let url;
    if (process.env.ENV_NAME === 'development') {
      url = `https://localhost:${process.env.API_PORT_0}`;
    } else if (process.env.ENV_NAME === 'local-staging') {
      url = `https://localhost:${process.env.API_PORT_0}`;
    } else {
      url = `https://${process.env.UPSTREAM_BACKEND}`;
    }

    socket = io(url, {
      withCredentials: true,
    });
  };

  const startTimer = () => {
    isStarted.value = true;
  };
  const pauseTimer = () => {
    isStarted.value = false;
  };

  watch(
    () => isStarted.value,
    (timerStatus: boolean) => {
      if (timerStatus === true) {
        socket.emit('timerStatus', {
          id: userId,
          role: userRole,
          startTimer: true,
        });
      } else {
        socket.emit('timerStatus', {
          id: userId,
          role: userRole,
          startTimer: false,
        });
      }
    }
  );

  const disconnect = () => {
    socket.disconnect();
  };

  return {
    initSocket,
    startTimer,
    pauseTimer,
    disconnect,
    timerData,
  };
});
