import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { boot } from 'quasar/wrappers';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
// const api = axios.create({ baseURL: 'https://api.example.com' });

const apiURL =
  process.env.ENV_NAME === 'development'
    ? `https://${process.env.HOST_URL}:3000`
    : `https://${process.env.HOST_URL}/api`;

const api = axios.create({
  baseURL: apiURL,
  withCredentials: true,
});

export default boot(({ app }) => {
  dayjs.extend(duration);
  dayjs.extend(relativeTime);

  app.provide('axios', axios);
  app.provide('api', api);

  // // for use inside Vue files (Options API) through this.$axios and this.$api
  //
  // app.config.globalProperties.$axios = axios;
  // // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  // //       so you won't necessarily have to import axios in each vue file
  // app.config.globalProperties.$api = api;
  // // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  // //       so you can easily perform requests against your app's API

  axiosRetry(axios, {
    retries: 1,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      // You could do this way or try to implement your own
      return error.response?.data.status > 400;
      // something like this works too.
      // error.response.status === 401 || error.response.status >= 500;
    },
  });

  // TODO: Change axios instance name
  api.defaults.headers.common['Content-Type'] = 'application/json';
  axios.defaults.headers = {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0',
  };
  api.defaults.headers.post['Access-Control-Allow-Origin'] = [
    process.env.ENV_NAME === 'development'
      ? 'https://127.0.0.1'
      : 'https://pipetimer.com',
  ];
});

export { api, axios };
