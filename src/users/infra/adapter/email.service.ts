import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EmailService as ExternalEmailService } from 'src/email/email.service';
import { IEmailService } from 'src/users/application/adapter/iemail.service';

import { IRes } from '@/customTypes/interfaces/message.interface';

@Injectable()
export class EmailService implements IEmailService {
  constructor(private emailService: ExternalEmailService) {}

  async sendTokenEmail(
    event: string,
    email: string,
    token: string,
  ): Promise<IRes> {
    const result = await this.emailService.sendToken(event, email, token);
    if (result.success) return result;

    throw new InternalServerErrorException('Cannot send email');
  }
}
