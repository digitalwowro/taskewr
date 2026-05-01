import { getAppUrl } from "@/lib/env";
import { sendEmail, type EmailMessage } from "@/server/email/smtp";

type PasswordResetEmailInput = {
  to: string;
  name: string;
  token: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildPasswordResetEmail(input: PasswordResetEmailInput): EmailMessage {
  const resetUrl = new URL("/auth/reset-password", getAppUrl());
  resetUrl.searchParams.set("token", input.token);
  const safeName = escapeHtml(input.name);
  const safeUrl = escapeHtml(resetUrl.toString());

  return {
    to: input.to,
    subject: "Reset your Taskewr password",
    text: [
      `Hi ${input.name},`,
      "",
      "Use this link to reset your Taskewr password:",
      resetUrl.toString(),
      "",
      "This link expires in 60 minutes. If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: [
      `<p>Hi ${safeName},</p>`,
      `<p>Use this link to reset your Taskewr password:</p>`,
      `<p><a href="${safeUrl}">${safeUrl}</a></p>`,
      `<p>This link expires in 60 minutes. If you did not request this, you can ignore this email.</p>`,
    ].join(""),
  };
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  await sendEmail(buildPasswordResetEmail(input));
}
