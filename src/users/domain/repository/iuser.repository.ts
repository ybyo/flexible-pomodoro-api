import { User } from '../user.model';

export interface IUserRepository {
  findByEmail: (email: string) => Promise<User | null>;
  findByEmailAndPassword: (email: string, password: string) => Promise<User>;
  findBySignupVerifyToken: (signupVerifyToken: string) => Promise<User>;
  findByResetPasswordVerifyToken: (
    resetPasswordVerifyToken: string,
  ) => Promise<User>;

  saveUser: (user: User) => Promise<void>;
  // TODO: 파라메터 범위 좁히기
  updateUser: (criteria: object, partialEntity: object) => Promise<void>;
}
