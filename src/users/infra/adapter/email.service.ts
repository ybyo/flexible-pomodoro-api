import { Injectable } from '@nestjs/common';

import { EmailService as ExternalEmailService } from '@/email/email.service';
import { IEmailAdapter } from '@/users/application/adapter/iemail.adapter';

@Injectable()
export class EmailService implements IEmailAdapter {
  constructor(private emailService: ExternalEmailService) {}

  async sendSignupEmailToken(email: string, token: string): Promise<void> {
    await this.emailService.sendSignupEmailToken(email, token);
  }
  async sendResetPasswordToken(email: string, token: string): Promise<void> {
    await this.emailService.sendResetPasswordToken(email, token);
  }
  async sendChangeEmailToken(email: string, token: string): Promise<void> {
    await this.emailService.sendChangeEmailToken(email, token);
  }
}
