import * as argon2 from 'argon2';
import { UserFactory } from 'src/users/domain/user.factory';
import { UserEntity } from '../entity/user.entity';
import { User } from '@/users/domain/user.model';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IUserRepository } from 'src/users/domain/repository/iuser.repository';
import { DataSource, Repository } from 'typeorm';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectMapper() private mapper: Mapper,
    private datasource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private userFactory: UserFactory,
    @Inject(Logger) private readonly logger: LoggerService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOneBy({ email: email });

    if (!userEntity) {
      return null;
    }

    const newEntity = this.mapper.map(userEntity, UserEntity, User);

    return this.userFactory.reconstitute(newEntity);
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
      signupVerifyToken: signupVerifyToken,
    });
    if (!userEntity) {
      return null;
    }

    const newEntity = this.mapper.map(userEntity, UserEntity, User);

    return this.userFactory.reconstitute(newEntity);
  }

  async findByResetPasswordVerifyToken(
    resetPasswordVerifyToken: string,
  ): Promise<User | null> {
    const userEntity = await this.userRepository.findOneBy({
      resetPasswordToken: resetPasswordVerifyToken,
    });
    if (!userEntity) {
      return null;
    }

    const newEntity = this.mapper.map(userEntity, UserEntity, User);

    return this.userFactory.reconstitute(newEntity);
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
    await this.datasource.transaction(async (manager) => {
      const newUser = UserEntity.create({ ...user });

      await manager.save(newUser);
    });
  }

  // TODO: 해당 카테고리가 실제로 있는지, 있다면 타입은 일치하는지 사전에 확인
  async updateUser(criteria: object, partialEntity: object): Promise<void> {
    await this.datasource.transaction(async (manager) => {
      // TODO: 에러 처리 구간 확인, 에러메시지 작성
      const user = await this.userRepository.findOneBy(criteria);
      if (!user) {
        return null;
      } else {
        if ('password' in partialEntity) {
          partialEntity.password = await argon2.hash(
            partialEntity.password as string,
          );
        }
        await manager.update(UserEntity, criteria, partialEntity);
      }
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log('Deleted unverified accounts');

    const deadline = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('isVerified = :isVerified', { isVerified: 0 })
      .andWhere('createdAt <= :deadline', { deadline })
      .getRawMany();

    if (users.length !== 0) {
      for (const user of users) {
        const userId = user['user_id'];
        await this.userRepository.delete(userId);
        console.log(
          `Account deleted because validation deadline is over: ${user['email']}`,
        );
      }
    }

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
}
