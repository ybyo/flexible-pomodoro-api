export interface IUser {
  id: string;
  userName: string;
  email: string;
}

export interface IGeneralResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
