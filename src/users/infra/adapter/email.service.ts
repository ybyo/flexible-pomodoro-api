import { Injectable } from '@nestjs/common';
import { EmailService as ExternalEmailService } from 'src/email/email.service';
import { IEmailService } from 'src/users/application/adapter/iemail.service';

@Injectable()
export class EmailService implements IEmailService {
  constructor(private emailService: ExternalEmailService) {}

  async sendUserSignupVerification(
    email: string,
    signupToken: string,
  ): Promise<void> {
    await this.emailService.sendUserSignupVerification(email, signupToken);
  }

  async sendResetPasswordToken(
    email: string,
    signupToken: string,
  ): Promise<void> {
    await this.emailService.sendPasswordResetVerification(email, signupToken);
  }

  async sendChangeEmailVerification(
    email: string,
    changeEmailVerifyToken: string,
  ): Promise<void> {
    await this.emailService.sendChangeEmailVerification(
      email,
      changeEmailVerifyToken,
    );
  }
}
