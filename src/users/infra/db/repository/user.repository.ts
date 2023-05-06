import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Inject,
  Injectable,
  Logger,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { IUserRepository } from 'src/users/domain/repository/iuser.repository';
import { UserFactory } from 'src/users/domain/user.factory';
import { DataSource, In, Repository } from 'typeorm';

import { IRes } from '@/customTypes/interfaces/message.interface';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { RoutineToTimerEntity } from '@/routines/infra/db/entity/routine-to-timer.entity';
import { User } from '@/users/domain/user.model';

import { UserEntity } from '../entity/user.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectMapper() private mapper: Mapper,
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RoutineEntity)
    private routineRepository: Repository<RoutineEntity>,
    @InjectRepository(RoutineToTimerEntity)
    private routineToTimerRepository: Repository<RoutineToTimerEntity>,
    private userFactory: UserFactory,
    @Inject(Logger) private readonly logger: LoggerService,
  ) {}

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOneBy({ id });

    if (!userEntity) {
      return null;
    }

    const user = await this.mapper.map(userEntity, UserEntity, User);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOneBy({ email });

    if (!userEntity) {
      return null;
    }

    return this.mapper.map(userEntity, UserEntity, User);
  }

  async findByEmailAndPassword(
    email: string,
    password: string,
  ): Promise<User | null> {
    const userEntity = await this.userRepository.findOneBy({
      email: email,
      password: password,
    });
    if (!userEntity) {
      return null;
    }

    const newEntity = this.mapper.map(userEntity, UserEntity, User);

    return this.userFactory.reconstitute(newEntity);
  }

  async findByToken(column: string, token: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOneBy({ [column]: token });
    if (!userEntity) return null;

    const user = this.mapper.map(userEntity, UserEntity, User);

    return user;
  }

  async findByUsername(userName: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOneBy({ userName });

    if (!userEntity) return null;
    const user = this.mapper.map(userEntity, UserEntity, User);

    return user;
  }

  async saveUser(user: User): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const newUser = UserEntity.create({ ...user });

      await manager.save(newUser);
    });
  }

  async updateUser(criteria: object, partialEntity: object): Promise<IRes> {
    await this.dataSource.transaction(async (manager) => {
      const user = await this.userRepository.findOneBy(criteria);

      if (user !== null && 'password' in partialEntity) {
        partialEntity.password = await argon2.hash(
          partialEntity.password as string,
        );
      }

      await manager.update(UserEntity, criteria, partialEntity);
    });

    return { success: true };
  }

  async deleteUser(id: string): Promise<IRes> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`Cannot find user id: ${id}`);
    }

    await this.dataSource.transaction(async (manager): Promise<void> => {
      // Deletes routine data
      const routines = await manager.find(RoutineEntity, {
        where: { userId: user.id },
      });

      if (routines.length !== 0) {
        const routineIds = routines.map((routine) => routine.id);
        await manager.delete(RoutineToTimerEntity, {
          routineId: In(routineIds),
        });
      }

      // Deletes user data
      await manager.delete(UserEntity, user.id);
    });

    return { success: true };
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }
}
