import * as nodemailer from 'nodemailer';
import { AccountToken } from '../../../types/account/AccountToken';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Context, Project } from '@frontastic/extension-types';
import { SmtpConfig } from '../interfaces/SmtpConfig';
import { SmtpConfigurationError } from '../errors/SmtpConfigurationError';

export class EmailApi {
  // Email transporter
  transport: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

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

  async sendEmail(data: { to: string; subject?: string; text?: string; html?: string }) {
    const from = this.sender;
    const { to, text, html, subject } = data;
    return await this.transport.sendMail({ from, to, subject, text, html });
  }

  async sendAccountConfirmationEmail(accountConfirmationToken: AccountToken) {
    if (!accountConfirmationToken.token) {
      console.error('No valid confirmation token');
      return;
    }

    const verificationUrl = this.getUrl(accountConfirmationToken.token, 'verify');

    const htmlVerificationMessage = `
      <h1>Thanks for your registration!</h1>
      <p style="margin-top: 10px;color:gray;">Please activate your account by clicking the below link</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
    `;

    try {
      await this.sendEmail({
        to: accountConfirmationToken.email,
        subject: 'Account Verification',
        html: htmlVerificationMessage,
      });
    } catch (error) {}
  }

  async sendPasswordResetEmail(passwordResetToken: AccountToken) {
    if (!passwordResetToken.token) {
      console.error('No valid reset token');
      return;
    }

    const url = this.getUrl(passwordResetToken.token, 'reset-password');
    const htmlResetPasswordMessage = `
      <h1>You requested a password reset!</h1>
      <p style="margin-top: 10px;color:gray;">Please click the link below to proceed.</p>
      <a href="${url}">${url}</a>
    `;

    await this.sendEmail({
      to: passwordResetToken.email,
      subject: 'Password Reset',
      html: htmlResetPasswordMessage,
    });
  }

  async sendPaymentConfirmationEmail(email: string) {
    const htmlPaymentConfirmationMessage = `
      <h1>Thanks for your order!</h1>
      <p style="margin-top: 10px;color:gray;">Your payment has been confirmed.</p>
    `;

    try {
      await this.sendEmail({
        to: email,
        subject: 'Payment confirmed',
        html: htmlPaymentConfirmationMessage,
      });
    } catch (error) {}
  }

  protected getSmtpConfig(project: Project): SmtpConfig {
    if (!project.configuration.hasOwnProperty('smtp')) {
      throw new SmtpConfigurationError({
        message: `The SMTP configuration is missing in project "${project.projectId}"`,
      });
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

  protected getUrl(token: string, relPath: string) {
    const path = `${relPath}?token=${token}`;

    return `${this.client_host}/${path}`;
  }
}
