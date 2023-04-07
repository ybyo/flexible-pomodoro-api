import { EmailService as ExternalEmailService } from 'src/email/email.service';
import { IEmailService } from 'src/users/application/adapter/iemail.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService implements IEmailService {
  constructor(private emailService: ExternalEmailService) {}

  async sendUserSignupVerification(
    email: string,
    signupVerifyToken: string,
  ): Promise<void> {
    await this.emailService.sendUserSignupVerification(
      email,
      signupVerifyToken,
    );
  }

  async sendPasswordResetVerification(
    email: string,
    signupVerifyToken: string,
  ): Promise<void> {
    await this.emailService.sendPasswordResetVerification(
      email,
      signupVerifyToken,
    );
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
