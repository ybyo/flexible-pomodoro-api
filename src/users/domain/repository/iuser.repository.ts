import { DataSource } from 'typeorm';

import { IRes } from '@/customTypes/interfaces/message.interface';

import { User } from '../user.model';

export interface IUserRepository {
  findById: (id: string) => Promise<User | null>;
  findByEmail: (email: string) => Promise<User | null>;
  findByEmailAndPassword: (email: string, password: string) => Promise<User>;
  findByToken: (column: string, token: string) => Promise<User | null>;
  findByUsername: (userName: string) => Promise<User | null>;
  saveUser: (user: User) => Promise<IRes>;
  updateToken: (
    user: Partial<User>,
    event: string,
    token: string,
    sendMail?: boolean,
  ) => Promise<IRes>;
  // TODO: 파라메터 범위 좁히기
  updateUser: (criteria: object, partialEntity: object) => Promise<IRes>;
  deleteUser: (email: string) => Promise<IRes>;
  getDataSource: () => DataSource;
}
