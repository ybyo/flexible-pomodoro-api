export interface IUser {
  uid: string;
  userName: string;
  email: string;
}

export interface IGeneralResponse<T> {
  success: boolean;
  data?: T;
}

export interface IErrorResponse {
  success: boolean;
  status: number;
  message: string;
}

export interface ILoginInput {
  email: string;
  password: string
}

export interface ISignupInput {
  userName: string;
  email: string;
  password: string
  passwordConfirm: string;
}
