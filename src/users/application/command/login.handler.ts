// TODO: 경로 표현방식 일치시키기
import { AuthService } from 'src/auth/auth.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUser } from '@/typeDefs/message.interface';
import { IUserRepository } from 'src/users/domain/repository/iuser.repository';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LoginCommand } from './login.command';
import { verifyPassword } from '@/utils/password-util';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private authService: AuthService,
  ) {}

  async execute(command: LoginCommand) {
    const { email, password } = command;

    // TODO: 데이터베이스가 완전히 비어있을 때 에러 처리
    // TODO: 로그인 인증절차 수정(우선 계정 존재 확인, 계정이 존재하면 비밀번호 확인)
    const user = await this.userRepository.findByEmail(email);

    const storedPassword = user.getPassword();
    const isValid = await verifyPassword(storedPassword, password);

    if (!isValid) {
      throw new NotFoundException('일치하는 계정 정보가 없습니다.');
    }

    const userPayload: IUser = {
      uid: user.getUid(),
      userName: user.getUserName(),
      email: user.getEmail(),
    };

    return userPayload;
  }
}
