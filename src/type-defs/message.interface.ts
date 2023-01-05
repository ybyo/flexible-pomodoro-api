export interface IUser {
  userId: string;
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
