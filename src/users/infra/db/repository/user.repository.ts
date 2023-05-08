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
import { DataSource, In, Repository } from 'typeorm';

import { IRes } from '@/customTypes/interfaces/message.interface';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { RoutineToTimerEntity } from '@/routines/infra/db/entity/routine-to-timer.entity';
import { IEmailService } from '@/users/application/adapter/iemail.service';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { UserFactory } from '@/users/domain/user.factory';
import { User } from '@/users/domain/user.model';
import { EmailService } from '@/users/infra/adapter/email.service';
import { UserEntity } from '@/users/infra/db/entity/user.entity';

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
    @Inject('EmailService') private emailService: IEmailService,
  ) {}

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOneBy({ id });

    if (!userEntity) return null;

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

  async saveUser(user: User): Promise<IRes> {
    await this.dataSource.transaction(async (manager) => {
      const newUser = UserEntity.create({ ...user });

      await this.emailService.sendTokenMail(
        'signupToken',
        user.email,
        user.signupToken,
      );

      await manager.save(newUser);
    });

    return { success: true };
  }

  async updateToken(
    user: Partial<User>,
    event: string,
    token: string,
    sendMail?: boolean,
  ): Promise<IRes> {
    await this.dataSource.transaction(async (manager) => {
      if (!!sendMail && !!user.email) {
        await this.emailService.sendTokenMail(event, user.email, token);
      }

      await manager.update(UserEntity, { id: user.id }, { [event]: token });
    });

    return { success: true };
  }

  async updateUser(user: Partial<User>, column: Partial<User>): Promise<IRes> {
    await this.dataSource.transaction(async (manager) => {
      if ('password' in column) {
        column.password = await argon2.hash(column.password as string);
      }

      await manager.update(UserEntity, { email: user.email }, column);
    });

    return { success: true };
  }

  async deleteUser(id: string): Promise<IRes> {
    const user = await this.userRepository.findOneBy({ id });

    if (user === null)
      throw new NotFoundException(`Cannot find user id: ${id}`);

    await this.dataSource.transaction(async (manager): Promise<void> => {
      await this.deleteRoutine(id);

      await manager.delete(UserEntity, user.id);
    });

    return { success: true };
  }

  async deleteRoutine(id: string): Promise<IRes> {
    await this.dataSource.transaction(async (manager): Promise<void> => {
      // Deletes routine data
      const routines = await manager.find(RoutineEntity, {
        where: { userId: id },
      });

      if (routines.length !== 0) {
        const routineIds = routines.map((routine) => routine.id);
        await manager.delete(RoutineToTimerEntity, {
          routineId: In(routineIds),
        });
      }
    });

    return { success: true };
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }
}
