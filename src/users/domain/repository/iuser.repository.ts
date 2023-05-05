import { DataSource } from 'typeorm';

import { IRes } from '@/customTypes/interfaces/message.interface';

import { User } from '../user.model';

export interface IUserRepository {
  findById: (id: string) => Promise<User | null>;
  findByEmail: (email: string) => Promise<User | null>;
  findByEmailAndPassword: (email: string, password: string) => Promise<User>;
  findBySignupToken: (signupToken: string) => Promise<User | null>;
  findByResetPasswordToken: (
    resetPasswordToken: string,
  ) => Promise<User | null>;
  findByChangeEmailToken: (changeEmailToken: string) => Promise<any>;
  findByUsername: (userName: string) => Promise<User | null>;
  saveUser: (user: User) => Promise<void>;
  // TODO: 파라메터 범위 좁히기
  updateUser: (criteria: object, partialEntity: object) => Promise<void>;
  deleteUser: (email: string) => Promise<IRes>;
  getDataSource: () => DataSource;
}
