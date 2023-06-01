export interface IUser {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
}

export interface IRes<T = void> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface IErrorResponse {
  success: boolean;
  status: number;
  message: string;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface ISignupInput {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface IChangePasswordInput {
  password: string;
  confirmPassword: string;
}

export interface IEmailInput {
  email: string;
}

export interface INameInput {
  newName: string;
}

export interface IValidationInput {
  validation: string;
}
