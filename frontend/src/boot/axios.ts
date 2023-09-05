import axios from 'axios';
import axiosRetry from 'axios-retry';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { boot } from 'quasar/wrappers';

let apiURL;

if (
  process.env.ENV_NAME === 'local-staging' ||
  process.env.ENV_NAME === 'development'
) {
  apiURL = `https://localhost:${process.env.API_PORT_0}`;
} else {
  apiURL = `https://${process.env.UPSTREAM_BACKEND}`;
}

const api = axios.create({
  baseURL: apiURL,
  withCredentials: true,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': [
      `https://${process.env.UPSTREAM_BACKEND}`,
      `https://${process.env.UPSTREAM_BACKEND}:${process.env.API_PORT_0}`,
    ],
  },
});

export default boot(() => {
  dayjs.extend(duration);
  dayjs.extend(relativeTime);

  axiosRetry(axios, {
    retries: 1,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      if (axios.isAxiosError(error)) {
        return error.response?.data.status > 400;
      }

      return false;
    },
  });
});

export { api, axios };
