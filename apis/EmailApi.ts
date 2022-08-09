import * as nodemailer from 'nodemailer';
import { Account } from '../../../types/account/Account';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Context, Project } from '@frontastic/extension-types';
import { SmtpConfig } from '../interfaces/SmtpConfig';

export class EmailApi {
  // Email transporter
  transport: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  // Sender email
  sender: string;

  client_host: string;

  constructor(frontasticContext: Context) {
    const smtpConfig = this.getSmtpConfig(frontasticContext.project);

    this.client_host = smtpConfig.client_host;
    this.sender = smtpConfig.sender;
    this.transport = nodemailer.createTransport({
      host: smtpConfig.host,
      port: +smtpConfig.port,
      secure: smtpConfig.port == 465,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },
    });
  }

  //Use this for debugging/testing purposes
  async initTest() {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    const testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    this.transport = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }

  getUrl(token: string, relPath: string, host: string) {
    const path = `${relPath}?token=${token}`;
    const url = `${host}/${path}`;
    return url;
  }

  async sendEmail(data: { to: string; subject?: string; text?: string; html?: string }) {
    const from = this.sender;
    const { to, text, html, subject } = data;
    return await this.transport.sendMail({ from, to, subject, text, html });
  }

  async sendVerificationEmail(account: Account, host: string) {
    if (!account.confirmationToken) return; //no valid confirmation token
    //Verification url
    const url = this.getUrl(account.confirmationToken, 'verify', host);

    //message content
    const html = `
                  <h1>Thanks for your registration!</h1>
                  <p style="margin-top: 10px;color:gray;">Please activate your account by clicking the below link</p>
                  <a href="${url}">${url}</a>
                `;
    //send email
    try {
      await this.sendEmail({
        to: account.email,
        subject: 'Account Verification',
        html,
      });
    } catch (error) {}
  }

  async sendPasswordResetEmail(token: string, email: string, host: string) {
    if (!token) return; //not a valid token
    //Password reset URL
    const url = this.getUrl(token, 'reset-password', host);
    //message content
    const html = `
                  <h1>You requested a password reset!</h1>
                  <p style="margin-top: 10px;color:gray;">Please click the link below to proceed.</p>
                  <a href="${url}">${url}</a>
                `;
    //send email
    await this.sendEmail({
      to: email,
      subject: 'Password Reset',
      html,
    });
  }

  async sendPaymentConfirmationEmail(email: string) {
    //message content
    const html = `
                  <h1>Thanks for your order!</h1>
                  <p style="margin-top: 10px;color:gray;">Your payment has been confirmed.</p>
                `;
    //send email
    try {
      await this.sendEmail({
        to: email,
        subject: 'Payment confirmed',
        html,
      });
    } catch (error) {}
  }

  protected getSmtpConfig(project: Project): SmtpConfig {
    if (!project.configuration.hasOwnProperty('smtp')) {
      // TODO: create a new exception for missing configuration
      throw new Error(`smtp configuration missing in project ${project.projectId}`);
    }

    const smtpConfig: SmtpConfig = {
      host: project.configuration.smtp.host,
      port: project.configuration.smtp.port,
      encryption: project.configuration.smtp.encryption,
      user: project.configuration.smtp.user,
      password: project.configuration.smtp.password,
      sender: project.configuration.smtp.sender,
      client_host: project.configuration.smtp.client_host,
    };

    return smtpConfig;
  }
}
