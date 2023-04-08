export interface IUser {
  id: string;
  userName: string;
  email: string;
}

export interface IRes<T = void> {
  success: boolean;
  data?: T;
  message?: string;
}
