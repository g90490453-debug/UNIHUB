import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || 'unihub_dev_jwt_secret_key_change_in_prod_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  MONGODB_URI: process.env.MONGODB_URI || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'unihub_rzp_sandbox_secret_2026',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'UNIHUB Academic <noreply@unihub.edu>',
  MAX_UPLOAD_MB: Number(process.env.MAX_UPLOAD_MB || 15),
  UPLOAD_DIR: path.resolve(process.cwd(), 'uploads'),
  DATA_DIR: path.resolve(process.cwd(), 'data'),
};
