import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import * as sgMail from '@sendgrid/mail';
import * as ejs from 'ejs';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

import emailConfig from '@/config/email.config';

@Injectable()
export class EmailService {
  private readonly host: string;
  private transporter: nodemailer.Transporter;

  constructor(
    @Inject(emailConfig.KEY)
    private config: ConfigType<typeof emailConfig>,
    private logger: Logger,
  ) {
    this.host =
      process.env.NODE_ENV === 'development'
        ? '127.0.0.1:4000'
        : `${this.config.host}`;

    if (this.config.auth.sgMailKey) {
      sgMail.setApiKey(this.config.auth.sgMailKey);
    } else {
      this.transporter = nodemailer.createTransport({
        service: config.auth.testService,
        auth: {
          user: config.auth.testUser,
          pass: config.auth.testPassword,
        },
      });
    }
  }

  private sendToken(email, subject, url, template): void {
    let rendered;

    const variables = {
      app_name: 'Pipe Timer',
      verification_url: url,
    };

    ejs.renderFile(template, variables, (err, data) => {
      if (err) console.log(err);
      rendered = data;
    });

    const mailOptions: MailDataRequired = {
      to: email,
      subject: `Pipe Timer - ${subject}`,
      from: 'no-reply@pipetimer.com',
      html: rendered,
    };

    const nodemailerOptions = {
      to: email,
      subject: `Pipe Timer - ${subject}`,
      html: rendered,
    };

    if (this.config.auth.sgMailKey) {
      sgMail.send(mailOptions).then(() => {
        this.logger.verbose(
          `Email sent successfully...\nTo: ${email}\nSubject: ${subject}`,
        );
      });
    } else {
      this.transporter.sendMail(nodemailerOptions).then(() => {
        this.logger.verbose(
          `[Nodemailer] Email sent with Nodemailer successfully...\nTo: ${email}\nSubject: ${subject}`,
        );
      });
    }
  }

  sendSignupEmailToken(email: string, token: string): void {
    const subject = '회원가입 인증';
    const url = `https://${this.host}/users/verify-email?signupToken=${token}`;
    const template = path.join(
      __dirname,
      '../../public/signup-email-inlined.ejs',
    );

    this.sendToken(email, subject, url, template);
  }

  sendChangeEmailToken(email: string, token: string): void {
    const subject = '이메일 변경';
    const url = `https://${this.host}/users/verify-change-email-token?changeEmailToken=${token}`;
    const template = path.join(
      __dirname,
      '../../public/change-email-inlined.ejs',
    );

    this.sendToken(email, subject, url, template);
  }

  sendResetPasswordToken(email: string, token: string): void {
    const subject = '비밀번호 재설정';
    const url = `https://${this.host}/users/verify-reset-password?resetPasswordToken=${token}`;
    const template = path.join(
      __dirname,
      '../../public/reset-password-inlined.ejs',
    );

    this.sendToken(email, subject, url, template);
  }
}
