import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as ejs from 'ejs';
import * as path from 'path';

import emailConfig from '@/config/email.config';
import { IRes } from '@/customTypes/interfaces/message.interface';
import sgMail = require('@sendgrid/mail');
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';

@Injectable()
export class EmailService {
  constructor(
    @Inject(emailConfig.KEY)
    private config: ConfigType<typeof emailConfig>,
  ) {
    sgMail.setApiKey(this.config.auth.sgMailApi);
  }

  async sendToken(
    event: string,
    emailAddress: string,
    token: string,
  ): Promise<IRes> {
    const host =
      process.env.NODE_ENV === 'development'
        ? '127.0.0.1:4000'
        : `${this.config.host}`;

    let url;
    let template;
    let dataMap;
    let rendered;
    let subject;

    if (event === 'signup') {
      subject = '회원가입 인증';
      url = `https://${host}/users/verify-email?signupToken=${token}`;
      template = path.join(__dirname, '../../public/signup-email-inlined.ejs');
      dataMap = {
        app_name: 'Pipe Timer',
        verification_url: url,
      };
    } else if (event === 'resetPassword') {
      subject = '비밀번호 재설정';
      url = `https://${host}/users/verify-reset-password?resetPasswordToken=${token}`;
      template = path.join(
        __dirname,
        '../../public/reset-password-inlined.ejs',
      );
      dataMap = {
        app_name: 'Pipe Timer',
        verification_url: url,
      };
    } else if (event === 'changeEmail') {
      subject = '이메일 변경';
      url = `https://${host}/users/verify-change-email?changeEmailVerifyToken=${token}`;
      template = path.join(__dirname, '../../public/change-email-inlined.ejs');
      dataMap = {
        app_name: 'Pipe Timer',
        verification_url: url,
      };
    }

    ejs.renderFile(template, dataMap, (err, data) => {
      if (err) console.log(err);

      rendered = data;
    });

    const mailOptions: MailDataRequired = {
      to: emailAddress,
      subject: `Pipe Timer - ${subject}`,
      from: 'no-reply@pipetimer.com',
      html: rendered,
    };

    return sgMail
      .send(mailOptions)
      .then(() => ({
        success: true,
        message: event,
      }))
      .catch((err) => {
        console.log(err);
        return { success: false };
      });
  }
}
