import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import emailConfig from '@/config/email.config';
import * as path from 'path';
import * as ejs from 'ejs';
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
      process.env.NODE_ENV === 'staging'
        ? `${this.config.host}`
        : `${this.config.host}:4000`;

    const verificationUrl = `https://${url}/user/verify-email?signupVerifyToken=${signupVerifyToken}`;

    let renderedTemplate;

    const emailTemplateStr = path.join(
      __dirname,
      '../../public/signup-email-inlined.ejs',
    );

    const dataMap = {
      app_name: 'Flexible Pomodoro',
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
      subject: 'Flexible Pomodoro',
      from: 'no-reply@yibyeongyong.com',
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
}
