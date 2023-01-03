import { UserFactory } from 'src/users/domain/user.factory';
import { UserEntity } from '../entity/user.entity';
import { User } from 'src/users/domain/user';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IUserRepository } from 'src/users/domain/repository/iuser.repository';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    private connection: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private userFactory: UserFactory,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOneBy({ email: email });

    if (!userEntity) {
      return null;
    }

    return this.userFactory.reconstitute(userEntity);
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

    return this.userFactory.reconstitute(userEntity);
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

    return this.userFactory.reconstitute(userEntity);
  }

  async saveUser(user: User): Promise<void> {
    await this.connection.transaction(async (manager) => {
      const newUser = new UserEntity(user);

      await manager.save(newUser);
    });
  }

  // TODO: 해당 카테고리가 실제로 있는지, 있다면 타입은 일치하는지 사전에 확인
  async updateUser(criteria: object, partialEntity: object): Promise<void> {
    await this.connection.transaction(async (manager) => {
      // TODO: 에러 처리 구간 확인, 에러메시지 작성
      const user = await this.userRepository.findOneBy(criteria);
      if (!user) {
        return null;
      } else {
        await manager.update(UserEntity, criteria, partialEntity);
      }
    });
  }
}
