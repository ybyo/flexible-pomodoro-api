import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
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

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOneBy({ email: email });

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

  async findBySignupVerifyToken(
    signupVerifyToken: string,
  ): Promise<User | null> {
    const userEntity = await this.userRepository.findOneBy({
      signupVerifyToken,
    });

    if (!userEntity) {
      return null;
    }

    return this.mapper.map(userEntity, UserEntity, User);
  }

  async findByResetPasswordVerifyToken(
    resetPasswordVerifyToken: string,
  ): Promise<User | null> {
    const userEntity = await this.userRepository.findOneBy({
      resetPasswordToken: resetPasswordVerifyToken,
    });

    if (userEntity === null) {
      return null;
    }

    return this.mapper.map(userEntity, UserEntity, User);
  }

  async findByChangeEmailToken(changeEmailVerifyToken: string) {
    const userEntity = await this.userRepository.findOneBy({
      changeEmailToken: changeEmailVerifyToken,
    });
    if (!userEntity) {
      return null;
    }

    return userEntity;
  }

  async findByUsername(userName: string): Promise<UserEntity> {
    const result = await this.userRepository.findOneBy({ userName });

    return result;
  }

  async saveUser(user: User): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const newUser = UserEntity.create({ ...user });

      await manager.save(newUser);
    });
  }

  async updateUser(criteria: object, partialEntity: object): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const user = await this.userRepository.findOneBy(criteria);
      if (user !== null && 'password' in partialEntity) {
        partialEntity.password = await argon2.hash(
          partialEntity.password as string,
        );
      }

      await manager.update(UserEntity, criteria, partialEntity);
    });
  }

  async deleteUser(id: string): Promise<IRes> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`Cannot find user with email ${id}`);
    }

    await this.dataSource
      .transaction(async (manager): Promise<void> => {
        // Deletes routine data
        const routines = await this.routineRepository.find({
          where: { userId: user.id },
        });

        if (routines.length !== 0) {
          const routineIds = routines.map((routine) => routine.id);

          await this.routineToTimerRepository.delete({
            routineId: In(routineIds),
          });
        }

        // Deletes user data
        await this.userRepository.delete(user.id);
      })
      .catch(() => {
        throw new InternalServerErrorException(
          `Something went wrong while delete account`,
        );
      });

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }

  private async deleteUnverifiedAccounts(): Promise<void> {
    const signupDeadline = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('isVerified = :isVerified', { isVerified: 0 })
      .andWhere('createdAt <= :deadline', { deadline: signupDeadline })
      .getMany();

    if (users.length !== 0) {
      for (const user of users) {
        const userId = user['user_id'];

        await this.userRepository.delete(userId);
        console.log(
          `Account deleted because validation deadline is over: ${user['email']}`,
        );
      }
    }
  }

  private async deleteExpiredChangeEmailToken(): Promise<void> {
    // Deletes unchanged emails
    const changeEmailDeadline = new Date(
      new Date().getTime() - 1 * 60 * 60 * 1000,
    );

    const emailUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('changeEmailToken != :changeEmailToken', {
        changeEmailToken: '',
      })
      .andWhere('changeEmailTokenCreated <= :deadline', {
        deadline: changeEmailDeadline,
      })
      .getMany();

    if (emailUsers.length !== 0) {
      for (const user of emailUsers) {
        user.changeEmailToken = null;
        user.changeEmailTokenCreated = null;
        user.newEmail = null;

        await this.userRepository.save(user);
        console.log(
          `Change email token, timestamp deleted because email not changed: ${user['email']}`,
        );
      }
    }
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  // async cleanToken(): Promise<void> {
  //   this.logger.log('Deleted unverified accounts');
  //
  //   await this.deleteUnverifiedAccounts();
  //   await this.deleteExpiredChangeEmailToken();
  // }
}
