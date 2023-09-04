import { defineStore } from 'pinia';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import { ref, watch } from 'vue';

export const useSocketStore = defineStore('SocketStore', () => {
  let socket: Socket;
  const isStarted = ref(false);
  const timerData = ref(null);

  const initSocket = () => {
    let url;
    if (
      process.env.ENV_NAME === 'local-staging' ||
      process.env.ENV_NAME === 'development'
    ) {
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
    (isStarted: boolean) => {
      if (isStarted === true) {
        socket.emit('startTimer', { startTimer: 'Start!!' });
      } else {
        socket.emit('stopTimer', { stopTimer: 'Stop!!' });
      }
    }
  );

  return {
    initSocket,
    startTimer,
    pauseTimer,
    timerData,
  };
});
