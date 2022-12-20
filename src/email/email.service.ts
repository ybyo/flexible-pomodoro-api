import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import emailConfig from '../config/emailConfig';
import Mail = require('nodemailer/lib/mailer');
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private transporter: Mail;

  constructor(
    @Inject(emailConfig.KEY)
    private config: ConfigType<typeof emailConfig>,
  ) {
    this.transporter = nodemailer.createTransport({
      service: config.service,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });
  }

  async sendUserSignupVerification(
    emailAddress: string,
    signupVerifyToken: string,
  ) {
    const baseUrl = this.config.baseUrl;
    const verification_url = `${baseUrl}/users/email-verify?signupVerifyToken=${signupVerifyToken}`;

    let renderedTemplate = '';

    const emailTemplateStr = path.join(
      __dirname,
      '../../public/signup-email-inlined.ejs',
    );

    const dataMap = {
      app_name: 'Flexible Pomodoro',
      verification_url: verification_url,
    };

    await ejs.renderFile(emailTemplateStr, dataMap, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        renderedTemplate = data;
      }
    });

    const mailOptions: EmailOptions = {
      to: emailAddress,
      subject: 'Flexible Pomodoro',
      html: renderedTemplate,
    };

    return await this.transporter.sendMail(mailOptions);
  }
}
