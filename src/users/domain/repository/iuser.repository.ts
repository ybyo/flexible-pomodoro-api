import { DataSource } from 'typeorm';

import { IRes } from '@/customTypes/interfaces/message.interface';
import { UserEntity } from '@/users/infra/db/entity/user.entity';

import { User } from '../user.model';

export interface IUserRepository {
  findByEmail: (email: string) => Promise<User | null>;
  findByEmailAndPassword: (email: string, password: string) => Promise<User>;
  findBySignupVerifyToken: (signupVerifyToken: string) => Promise<User | null>;
  findByResetPasswordVerifyToken: (
    resetPasswordVerifyToken: string,
  ) => Promise<User | null>;
  findByChangeEmailToken: (changeEmailToken: string) => Promise<any>;
  findByUsername: (userName: string) => Promise<UserEntity>;
  saveUser: (user: User) => Promise<void>;
  // TODO: 파라메터 범위 좁히기
  updateUser: (criteria: object, partialEntity: object) => Promise<void>;
  deleteUser: (email: string) => Promise<IRes>;
  getDataSource: () => DataSource;
}
