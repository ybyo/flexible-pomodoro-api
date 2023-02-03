import axiosRetry from 'axios-retry';
import { EventBus } from 'quasar';
import { boot } from 'quasar/wrappers';
import axios, { AxiosInstance } from 'axios';

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

const apiURL = `http://${process.env.API_BASE_URL}`;

const api = axios.create({
  baseURL: apiURL,
  withCredentials: true,
});

export default boot(({ app }) => {
  const bus = new EventBus();
  app.provide('bus', bus);
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
      console.log(error);
      // You could do this way or try to implement your own
      return error.response?.data.status > 400;
      // something like this works too.
      // error.response.status === 401 || error.response.status >= 500;
    },
  });

  // TODO: Change axios instance name
  api.defaults.headers.common['Content-Type'] = 'application/json';
  api.defaults.headers.post['Access-Control-Allow-Origin'] = [
    'http://localhost:3000',
  ];
});

export { axios, api };
