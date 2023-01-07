import { AuthService } from '@/auth/auth.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUser } from '@/type-defs/message.interface';
import { IUserRepository } from '@/users/domain/repository/iuser.repository';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ValidateUserCommand } from '@/auth/command/impl/validate-user.command';
import { verifyPassword } from '@/utils/password-util';

@Injectable()
@CommandHandler(ValidateUserCommand)
export class ValidateUserHandler
  implements ICommandHandler<ValidateUserCommand>
{
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private authService: AuthService,
  ) {}

  async execute(command: ValidateUserCommand) {
    const { email, password } = command;

    // TODO: 데이터베이스가 완전히 비어있을 때 에러 처리
    // TODO: 로그인 인증절차 수정(우선 계정 존재 확인, 계정이 존재하면 비밀번호 확인)
    const user = await this.userRepository.findByEmail(email);

    const storedPassword = user.password;
    const isValid = await verifyPassword(storedPassword, password);

    if (!isValid) {
      throw new NotFoundException('일치하는 계정 정보가 없습니다.');
    }

    const userPayload: IUser = {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
    };

    return userPayload;
  }
}