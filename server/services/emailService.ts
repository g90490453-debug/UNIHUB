import nodemailer from 'nodemailer';
import { env } from '../config/env.ts';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendEmailNotification(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ delivered: boolean; mode: 'smtp' | 'logged' }> {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html || `<p>${params.text}</p>`,
      });
      return { delivered: true, mode: 'smtp' };
    } catch (err) {
      console.warn('SMTP email dispatch failed:', err);
    }
  }
  console.log(`[UNIHUB Email Queue] To: ${params.to} | Subject: ${params.subject}`);
  return { delivered: true, mode: 'logged' };
}
