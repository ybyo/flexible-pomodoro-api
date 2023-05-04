import { Injectable } from '@nestjs/common';
import { EmailService as ExternalEmailService } from 'src/email/email.service';
import { IEmailService } from 'src/users/application/adapter/iemail.service';

@Injectable()
export class EmailService implements IEmailService {
  constructor(private emailService: ExternalEmailService) {}

  async sendTokenEmail(
    event: string,
    email: string,
    token: string,
  ): Promise<void> {
    await this.emailService.sendToken(event, email, token);
  }
}
