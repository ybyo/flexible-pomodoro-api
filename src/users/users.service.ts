import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { ulid } from 'ulid';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { UserInfo } from '../UserInfo';
import { UserEntity } from '../entity/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private emailService: EmailService,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private connection: Connection,
    private authService: AuthService,
  ) {}

  async createUser(name: string, email: string, password: string) {
    const userExist = await this.checkUserExists(email);
    if (!userExist) {
      throw new UnprocessableEntityException(
        'This email has already been registered.',
      );
    }
    const signupVerifyToken = ulid();

    await this.saveUserUsingTransaction(
      name,
      email,
      password,
      signupVerifyToken,
    );
  }

  async verifyEmail(signupVerifyToken: string): Promise<string> {
    const user = await this.usersRepository.findOneBy({
      signupVerifyToken: signupVerifyToken,
    });

    if (user === null) {
      throw new NotFoundException('User does not exist.');
    }

    return this.authService.login({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }

  async login(email: string, password: string): Promise<string> {
    const user = await this.usersRepository.findOneBy({
      email: email,
      password: password,
    });

    if (user === null) {
      throw new NotFoundException('The account could not be found.');
    }

    return this.authService.login({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }

  async getUserInfo(userId: string): Promise<UserInfo> {
    const user = await this.usersRepository.findOneBy({ id: userId });

    if (user === null) {
      throw new NotFoundException('This user does not exist.');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  private async checkUserExists(emailAddress: string): Promise<boolean> {
    const res = await this.usersRepository.findOneBy({ email: emailAddress });

    return res === null;
  }

  private async sendMemberJoinEmail(email: string, signupVerifyToken: string) {
    await this.emailService.sendMemberJoinVerification(
      email,
      signupVerifyToken,
    );
  }

  private async saveUserUsingTransaction(
    name: string,
    email: string,
    password: string,
    signupVerifyToken: string,
  ) {
    await this.connection.transaction(async (manager) => {
      const user = new UserEntity();
      user.id = ulid();
      user.name = name;
      user.email = email;
      user.password = password;
      user.signupVerifyToken = signupVerifyToken;

      await manager.save(user);
      await this.sendMemberJoinEmail(email, signupVerifyToken);
    });
  }
}
