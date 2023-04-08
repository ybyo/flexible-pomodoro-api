import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as ejs from 'ejs';
import * as path from 'path';

import emailConfig from '@/config/email.config';
import { IRes } from '@/customTypes/interfaces/message.interface';
import nMail = require('nodemailer/lib/mailer');
import sgMail = require('@sendgrid/mail');
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';

@Injectable()
export class EmailService {
  private nMail: nMail;

  constructor(
    @Inject(emailConfig.KEY)
    private config: ConfigType<typeof emailConfig>,
  ) {
    sgMail.setApiKey(this.config.auth.sgMailApi);
  }

  async sendUserSignupVerification(
    emailAddress: string,
    signupVerifyToken: string,
  ) {
    const url =
      process.env.NODE_ENV === 'development'
        ? '127.0.0.1:4000'
        : `${this.config.host}`;

    const verificationUrl = `https://${url}/users/verify-email?signupVerifyToken=${signupVerifyToken}`;

    let renderedTemplate;

    const emailTemplateStr = path.join(
      __dirname,
      '../../public/signup-email-inlined.ejs',
    );

    const dataMap = {
      app_name: 'Pipe Timer - 회원가입 인증',
      verification_url: verificationUrl,
    };

    ejs.renderFile(emailTemplateStr, dataMap, (err, data) => {
      if (err) {
        throw new InternalServerErrorException(
          `Cannot render email template. Account creation reverted.\n${err}`,
        );
      } else {
        renderedTemplate = data;
      }
    });

    const mailOptions: MailDataRequired = {
      to: emailAddress,
      subject: 'Pipe Timer',
      from: 'no-reply@pipetimer.com',
      html: renderedTemplate,
    };

    return await sgMail
      .send(mailOptions)
      .then(() => {
        console.log('Verification email was successfully sent.');
      })
      .catch((err) => {
        console.log(err);
      });
  }

  async sendPasswordResetVerification(
    emailAddress: string,
    resetPasswordVerifyToken: string,
  ) {
    const url =
      process.env.NODE_ENV === 'development'
        ? '127.0.0.1:4000'
        : `${this.config.host}`;

    const verificationUrl = `https://${url}/users/verify-reset-password?resetPasswordVerifyToken=${resetPasswordVerifyToken}`;

    let renderedTemplate;

    const emailTemplateStr = path.join(
      __dirname,
      '../../public/reset-password-inlined.ejs',
    );

    const dataMap = {
      app_name: 'Pipe Timer',
      verification_url: verificationUrl,
    };

    ejs.renderFile(emailTemplateStr, dataMap, (err, data) => {
      if (err) {
        throw new InternalServerErrorException(
          `Cannot render email template. Reset password reverted.\n${err}`,
        );
      } else {
        renderedTemplate = data;
      }
    });

    const mailOptions: MailDataRequired = {
      to: emailAddress,
      subject: 'Pipe Timer - 비밀번호 재설정',
      from: 'no-reply@pipetimer.com',
      html: renderedTemplate,
    };

    return await sgMail
      .send(mailOptions)
      .then(() => {
        console.log('Password reset email was successfully sent.');
      })
      .catch((err) => {
        console.log(err);
      });
  }

  async sendChangeEmailVerification(
    newEmail: string,
    changeEmailVerifyToken: string,
  ) {
    const url =
      process.env.NODE_ENV === 'development'
        ? '127.0.0.1:4000'
        : `${this.config.host}`;

    const verificationUrl = `https://${url}/users/verify-change-email?changeEmailVerifyToken=${changeEmailVerifyToken}`;

    let renderedTemplate;

    const emailTemplateStr = path.join(
      __dirname,
      '../../public/change-email-inlined.ejs',
    );

    const dataMap = {
      app_name: 'Pipe Timer - 이메일 변경 인증',
      verification_url: verificationUrl,
    };

    ejs.renderFile(emailTemplateStr, dataMap, (err, data) => {
      if (err) {
        throw new InternalServerErrorException(
          `Cannot render email template. Change email reverted.\n${err}`,
        );
      } else {
        renderedTemplate = data;
      }
    });

    const mailOptions: MailDataRequired = {
      to: newEmail,
      subject: 'Pipe Timer - 이메일 변경 인증',
      from: 'no-reply@pipetimer.com',
      html: renderedTemplate,
    };

    const res = {} as IRes;

    await sgMail
      .send(mailOptions)
      .then(() => {
        console.log('Verification email was sent successfully.');
        res.success = true;
      })
      .catch((err) => {
        console.log(err);
        res.success = false;
      });

    return res;
  }
}
