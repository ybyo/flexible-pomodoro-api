import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as sgmail from '@sendgrid/mail';
import { renderFile } from 'ejs';
import { createTransport, Transporter } from 'nodemailer';
import { join } from 'path';

import emailConfig from '@/config/email.config';
import { EmailFactory } from '@/email/domain/email.factory';
import {
  NodemailerEmailOptions,
  SendGridEmailOptions,
} from '@/email/domain/email.model';

@Injectable()
export class EmailService {
  private readonly host: string;
  private readonly templates = {
    signup: 'signup-email-inlined.ejs',
    changeEmail: 'change-email-inlined.ejs',
    resetPassword: 'reset-password-inlined.ejs',
  };
  private transporter: Transporter;

  constructor(
    @Inject(emailConfig.KEY)
    private config: ConfigType<typeof emailConfig>,
    private logger: Logger,
    private emailFactory: EmailFactory
  ) {
    this.host =
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'local-staging'
        ? `${this.config.host}:${process.env.FRONT_PORT_0}`
        : `${this.config.host}`;

    if (this.config.auth.sgMailKey) {
      sgmail.setApiKey(this.config.auth.sgMailKey);
    } else {
      this.transporter = createTransport({
        service: config.auth.testService,
        auth: {
          user: config.auth.testUser,
          pass: config.auth.testPassword,
        },
      });
    }
  }

  private async sendEmail(
    email: string,
    subject: string,
    templateName: keyof typeof this.templates,
    token: string,
    tokenQueryParam: string
  ) {
    const url = `https://${this.host}/users/verify-${templateName}?${tokenQueryParam}=${token}`;
    const templatePath = join(
      __dirname,
      `../public/${this.templates[templateName]}`
    );
    const rendered = this.renderEmail(url, templatePath);
    if (rendered) {
      this.sendVerificationEmail(email, subject, rendered);
    }
  }

  private sendVerificationEmail(
    email: string,
    subject: string,
    rendered: string
  ): void {
    if (this.config.auth.sgMailKey) {
      const sendgridEmailOptions = this.emailFactory.createOption(
        email,
        `Pipe Timer - ${subject}`,
        'no-reply@pipetimer.com',
        rendered
      ) as SendGridEmailOptions;

      sgmail.send(sendgridEmailOptions).then(() => {
        this.logger.verbose(
          `Email sent successfully...\nTo: ${email}\nSubject: ${subject}`
        );
      });
    } else {
      const nodemailerOptions = this.emailFactory.createOption(
        email,
        `Pipe Timer - ${subject}`,
        rendered
      ) as NodemailerEmailOptions;

      this.transporter.sendMail(nodemailerOptions).then(() => {
        this.logger.verbose(
          `[Nodemailer] Email sent with Nodemailer successfully...\nTo: ${email}\nSubject: ${subject}`
        );
      });
    }
  }

  private renderEmail(url: string, template: string): string | void {
    return renderFile(
      template,
      {
        app_name: 'Pipe Timer',
        verification_url: url,
      },
      (err: Error, rendered: string) => {
        return err ? console.error(err) : rendered;
      }
    );
  }

  async sendSignupEmailToken(email: string, token: string): Promise<void> {
    await this.sendEmail(
      email,
      '회원가입 인증',
      'signup',
      token,
      'signupToken'
    );
  }

  async sendChangeEmailToken(email: string, token: string): Promise<void> {
    await this.sendEmail(
      email,
      '이메일 변경',
      'changeEmail',
      token,
      'changeEmailToken'
    );
  }

  async sendResetPasswordToken(email: string, token: string): Promise<void> {
    await this.sendEmail(
      email,
      '비밀번호 재설정',
      'resetPassword',
      token,
      'resetPasswordToken'
    );
  }
}
