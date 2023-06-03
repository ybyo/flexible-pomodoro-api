import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CommandHandler, IQueryHandler } from '@nestjs/cqrs';

import { ResendEmailCommand } from '@/auth/application/command/impl/resend-email.command';
import { SuccessDto }         from '@/auth/interface/dto/success.dto';
import { IUserRepository }    from '@/users/domain/iuser.repository';

@Injectable()
@CommandHandler(ResendEmailCommand)
export class ResendEmailHandler implements IQueryHandler<ResendEmailCommand> {
  constructor(
    @Inject('UserRepository') private userRepository: IUserRepository,
    private logger: Logger,
  ) {}

  async execute(command: ResendEmailCommand): Promise<SuccessDto> {
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new BadRequestException('Cannot find user with email');
    }

    const oldSignupToken = user.signupToken;

    try {
      const result = await this.userRepository.renewSignupToken(
        command.email,
        oldSignupToken,
      );

      if (result.affected) return { success: true };
    } catch (err) {
      this.logger.log(err);

      throw new InternalServerErrorException('Cannot renew signup token');
    }
  }
}
