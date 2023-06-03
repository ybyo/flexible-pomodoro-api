import { api } from 'boot/axios';
import { Notify } from 'quasar';
import { usePanelStore } from 'src/core/panel/infra/store/panel.store';
import { ITimer } from 'src/core/timers/domain/timer.model';
import { useTimerStore } from 'src/core/timers/infra/store/timer.store';
import { userMsg } from 'src/core/users/domain/user.const';
import { useUserStore } from 'src/core/users/infra/store/user.store';
import {
  IChangePasswordInput,
  IEmailInput,
  ILoginInput,
  INameInput,
  IRes,
  ISignupInput,
  IUser,
  IValidationInput,
} from 'src/type-defs/userTypes';

export const refreshAccessTokenFn = () => {
  return api.get<IRes<IUser>>('auth/refresh');
};

// TODO: retry, retryDelay, maxRetries 설정
api.interceptors.response.use(
  (res) => {
    return res;
  },
  // TODO: 토큰 만료 확인 기능 추가
  // 토큰 만료로 인한 에러 메시지 발생
  // TODO: 서버 자체가 열려있지 않을 때 로그인 비활성화
  // TODO: 에러메시지를 각 서비스로 분산
  // TODO: 미들웨어에서 router.push 수행하도록 수정
  async (err) => {
    const userStore = useUserStore();
    const panelStore = usePanelStore();
    const timerStore = useTimerStore();

    const errMsg = err.response.data?.message as string;

    if (errMsg === 'Unauthorized' || errMsg === 'User not found') {
      try {
        await refreshAccessTokenFn();
      } catch {
        userStore.$reset();
        panelStore.$reset();
        timerStore.$reset();

        Notify.create({
          html: true,
          color: 'negative',
          message: userMsg.INVALID_TOKEN,
          icon: 'error',
        });
      }
    }

    return Promise.reject(err);
  }
);

export const checkEmailFn = async (email: IEmailInput) => {
  const response = await api.patch('auth/check-duplicate-email', email);

  return response.data;
};

export const signUpUserFn = async (user: ISignupInput) => {
  const response = await api.post('auth/register', user);
  return response.data;
};

export const loginUserFn = async (user: ILoginInput) => {
  const response = await api.post('auth/login', user);
  return response.data;
};

export const verifyEmailFn = async (signupToken: string): Promise<IRes> => {
  const response = await api.get(
    `users/verify-signup-token?signupToken=${signupToken}`
  );
  return response.data ? response.data : response;
};

export const logoutUserFn = async () => {
  const response = await api.delete('auth/logout');

  return response.data;
};

export const getMeFn = async () => {
  const response = await api.get('auth/me');
  return response.data;
};

export const sendResetPasswordEmailFn = async (
  email: IEmailInput
): Promise<IRes> => {
  const response = await api.post('users/send-reset-password-email', email);

  return response.data;
};

export const verifyResetPasswordTokenFn = async (
  resetPasswordToken: string
): Promise<IRes> => {
  const response = await api.get(
    `users/verify-reset-password-token?resetPasswordToken=${resetPasswordToken}`
  );
  return response.data ? response.data : response;
};

export const changePassword = async (password: IChangePasswordInput) => {
  const response = await api.post('users/change-password', password);

  return response.data;
};

export const sendChangeEmailTokenFn = async (
  email: IEmailInput
): Promise<void> => {
  const response = await api.post('users/send-change-email-token', email);

  return response.data;
};

export const verifyChangeEmailTokenFn = async (
  token: string
): Promise<void> => {
  const response = await api.get(
    `users/verify-change-email-token?changeEmailToken=${token}`
  );

  return response.data ? response.data : response;
};

export const changeNameFn = async (name: INameInput) => {
  const response = await api.post('users/change-name', name);

  return response.data;
};

export const deleteAccountFn = async (validation: IValidationInput) => {
  const response = await api.post('users/delete-account', validation);

  return response.data;
};

export const resendSignupEmailFn = async (email: string): Promise<IRes> => {
  const response = await api.post('auth/resend-signup-email', { email });

  return response.data;
};

export const saveTimerFn = async (timers: ITimer[]): Promise<IRes> => {
  const response = await api.post('timer/save', timers);

  return response.data;
};
