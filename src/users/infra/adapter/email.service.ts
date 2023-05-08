import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { IRes } from '@/customTypes/interfaces/message.interface';
import { EmailService as ExternalEmailService } from '@/email/email.service';
import { IEmailService } from '@/users/application/adapter/iemail.service';

@Injectable()
export class EmailService implements IEmailService {
  constructor(private emailService: ExternalEmailService) {}

  async sendTokenMail(
    event: string,
    email: string,
    token: string,
  ): Promise<IRes> {
    const result = await this.emailService.sendTokenEmail(event, email, token);
    if (result.success) return result;

    throw new InternalServerErrorException('Cannot send email');
  }
}
