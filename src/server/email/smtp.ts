import nodemailer from "nodemailer";

import { getSmtpConfig } from "@/lib/env";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(message: EmailMessage) {
  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: config.requireTLS,
    auth: config.user && config.password
      ? {
          user: config.user,
          pass: config.password,
        }
      : undefined,
  });

  await transporter.sendMail({
    from: config.from,
    replyTo: config.replyTo,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
