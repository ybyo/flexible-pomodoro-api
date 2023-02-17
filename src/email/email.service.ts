import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import emailConfig from '@/config/email.config';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import nMail = require('nodemailer/lib/mailer');
import sgMail = require('@sendgrid/mail');
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';

interface INodeMailerOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private nMail: nMail;

  constructor(
    @Inject(emailConfig.KEY)
    private config: ConfigType<typeof emailConfig>,
  ) {
    if (process.env.NODE_ENV === 'dev') {
      this.nMail = nodemailer.createTransport({
        service: config.service,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass,
        },
      });
    } else if (process.env.NODE_ENV === 'prod') {
      sgMail.setApiKey(this.config.auth.sgMailApi);
    }
  }

  async sendUserSignupVerification(
    emailAddress: string,
    signupVerifyToken: string,
  ) {
    const url = `${this.config.host}:${this.config.front_port}`;
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

    await ejs.renderFile(emailTemplateStr, dataMap, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        renderedTemplate = data;
      }
    });

    if (process.env.NODE_ENV === 'dev') {
      const mailOptions: INodeMailerOptions = {
        to: emailAddress,
        subject: 'Flexible Pomodoro',
        html: renderedTemplate,
      };
      return await this.nMail.sendMail(mailOptions);
    } else if (process.env.NODE_ENV === 'prod') {
      const mailOptions: MailDataRequired = {
        to: emailAddress,
        subject: 'Flexible Pomodoro',
        from: 'no-reply@yibyeongyong.com',
        html: renderedTemplate,
      };
      return await sgMail.send(mailOptions);
    }
  }
}
