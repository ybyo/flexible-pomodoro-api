import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import {
  DataSource,
  DeleteResult,
  In,
  Repository,
  UpdateResult,
} from 'typeorm';
import { ulid } from 'ulid';

import { RedisTokenService } from '@/redis/redis-token.service';
import { RoutineEntity } from '@/routines/infra/db/entity/routine.entity';
import { RoutineToTimerEntity } from '@/routines/infra/db/entity/routine-to-timer.entity';
import { IEmailAdapter } from '@/users/application/adapter/iemail.adapter';
import { IUserRepository } from '@/users/domain/iuser.repository';
import { UserFactory } from '@/users/domain/user.factory';
import { User, UserJwt, UserWithoutPassword } from '@/users/domain/user.model';
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
    @Inject(Logger) private logger: LoggerService,
    @Inject('EmailService') private emailService: IEmailAdapter,
    private redisService: RedisTokenService,
  ) {}
  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOneBy({ email });
    if (!userEntity) return null;

    return this.mapper.map(userEntity, UserEntity, User);
  }

  async findById(id: string): Promise<UserJwt | null> {
    const userEntity = await this.userRepository.findOneBy({ id });
    if (!userEntity) return null;

    return this.mapper.map(userEntity, UserEntity, UserJwt);
  }

  async findByEmailAndPassword(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    const userEntity = await this.userRepository.findOneBy({
      email: email,
      password: password,
    });
    if (!userEntity) return null;

    return this.mapper.map(userEntity, UserEntity, UserWithoutPassword);
  }

  async findBySignupToken(token: string): Promise<UserWithoutPassword | null> {
    const userEntity = await this.userRepository.findOneBy({
      signupToken: token,
    });
    if (!userEntity) return null;

    return this.mapper.map(userEntity, UserEntity, UserWithoutPassword);
  }

  async findByResetPasswordToken(
    token: string,
  ): Promise<UserWithoutPassword | null> {
    const userEntity = await this.userRepository.findOneBy({
      resetPasswordToken: token,
    });
    if (!userEntity) return null;

    return this.mapper.map(userEntity, UserEntity, UserWithoutPassword);
  }

  async findByUsername(name: string): Promise<UserWithoutPassword | null> {
    const userEntity = await this.userRepository.findOneBy({ name });
    if (!userEntity) return null;

    return this.mapper.map(userEntity, UserEntity, UserWithoutPassword);
  }

  private calculateExpirationTime(): number {
    return new Date(
      new Date().getTime() + +process.env.VERIFICATION_LIFETIME * 60 * 1000,
    ).getTime();
  }

  async registerUser(user: User): Promise<UserEntity | null> {
    const id = ulid();
    const token = ulid();
    const userEntity = UserEntity.create({ ...user, id, signupToken: token });
    const expiredAt = this.calculateExpirationTime();

    try {
      return await this.dataSource.transaction(
        async (manager): Promise<UserEntity> => {
          await this.emailService.sendSignupEmailToken(user.email, token);
          await this.redisService.setPXAT(
            `signupToken:${token}`,
            '1',
            expiredAt,
          );

          return await manager.save(userEntity);
        },
      );
    } catch (err) {
      this.logger.log(err);
      return null;
    }
  }

  async sendChangeEmailToken(
    oldEmail: string,
    newEmail: string,
  ): Promise<UpdateResult> {
    const token = ulid();
    const expiredAt = this.calculateExpirationTime();

    try {
      return await this.dataSource.transaction(async (manager) => {
        await this.emailService.sendChangeEmailToken(newEmail, token);

        await this.redisService.setPXAT(
          `changeEmailToken:${token}`,
          '1',
          expiredAt,
        );

        return await manager.update(
          UserEntity,
          { email: oldEmail },
          { changeEmailToken: token, newEmail },
        );
      });
    } catch (err) {
      await this.redisService.deleteValue(`changeEmailToken:${token}`);
    }
  }

  async updateUser(
    user: Partial<UserWithoutPassword>,
    column: Partial<UserWithoutPassword>,
  ): Promise<UpdateResult> {
    return await this.dataSource.transaction(
      async (manager): Promise<UpdateResult> => {
        return await manager.update(UserEntity, user, column);
      },
    );
  }

  async deleteUser(id: string): Promise<DeleteResult> {
    const deleteResult = await this.dataSource.transaction(async (manager) => {
      await this.deleteRoutine(id);

      return await manager.delete(UserEntity, id);
    });

    return deleteResult;
  }

  async deleteRoutine(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager): Promise<void> => {
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
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }

  async sendResetPasswordToken(email: string): Promise<UpdateResult> {
    const token = ulid();
    const expiredAt = this.calculateExpirationTime();

    return await this.dataSource.transaction(async (manager) => {
      await this.emailService.sendResetPasswordToken(email, token);
      await this.redisService.setPXAT(
        `resetPasswordToken:${token}`,
        '1',
        expiredAt,
      );

      return await manager.update(
        UserEntity,
        { email },
        { resetPasswordToken: token },
      );
    });
  }

  async verifySignupToken(id: string, token: string): Promise<UpdateResult> {
    return await this.dataSource.transaction(async (manager) => {
      await this.redisService.deleteValue(`signupToken:${token}`);

      return await manager.update(UserEntity, { id }, { signupToken: null });
    });
  }

  async changePassword(
    id: string,
    password: string,
    token: string,
  ): Promise<UpdateResult> {
    const redis = await this.redisService.getClient();
    const multi = redis.multi();
    multi.del(`resetPasswordToken:${token}`);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const hashed = await argon2.hash(password as string);

        await multi.exec();
        return await manager.update(
          UserEntity,
          { id },
          { password: hashed, resetPasswordToken: null },
        );
      });
    } catch (err) {
      await multi.discard();
    }
  }

  async findByChangeEmailToken(
    token: string,
  ): Promise<UserWithoutPassword | null> {
    const userEntity = await this.userRepository.findOneBy({
      changeEmailToken: token,
    });

    if (!userEntity) return null;

    return this.mapper.map(userEntity, UserEntity, UserWithoutPassword);
  }

  async changeEmail(
    id: string,
    newEmail: string,
    token: string,
  ): Promise<UpdateResult> {
    const redis = await this.redisService.getClient();
    const multi = redis.multi();
    multi.del(`changeEmailToken:${token}`);

    try {
      return await this.dataSource.transaction(async (manager) => {
        await multi.exec();

        return await manager.update(
          UserEntity,
          { id },
          { email: newEmail, changeEmailToken: null, newEmail: null },
        );
      });
    } catch (err) {
      await multi.discard();
    }
  }

  async findByToken(
    column: string,
    token: string,
  ): Promise<UserWithoutPassword | null> {
    const userEntity = await this.userRepository.findOneBy({ [column]: token });
    if (!userEntity) return null;

    return this.mapper.map(userEntity, UserEntity, UserWithoutPassword);
  }

  async renewSignupToken(
    email: string,
    oldToken: string,
  ): Promise<UpdateResult> {
    const redis = await this.redisService.getClient();
    const multi = redis.multi();
    const newToken = ulid();

    multi.rename(`signupToken:${oldToken}`, `signupToken:${newToken}`);

    return await this.dataSource.transaction(async (manager) => {
      await this.emailService.sendSignupEmailToken(email, newToken);
      await multi.exec();

      return await manager.update(
        UserEntity,
        { email },
        { signupToken: newToken },
      );
    });
  }
}
