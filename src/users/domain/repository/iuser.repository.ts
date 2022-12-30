import { User } from '../user';

export interface IUserRepository {
  findByEmail: (email: string) => Promise<User>;
  findByEmailAndPassword: (email: string, password: string) => Promise<User>;
  findBySignupVerifyToken: (signupVerifyToken: string) => Promise<User>;
  saveUser: (user: User) => Promise<void>;
  // TODO: 파라메터 범위 좁히기
  updateUser: (criteria: object, partialEntity: object) => Promise<void>;
}
