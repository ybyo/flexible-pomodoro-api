export interface IUser {
  id: string;
  userName: string;
  email: string;
}

export interface IRes<T> {
  success: boolean;
  data?: T;
  message?: string;
}
