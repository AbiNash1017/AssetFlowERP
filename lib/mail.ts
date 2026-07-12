import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const fromEmail = process.env.SMTP_FROM || smtpUser || "no-reply@assetflow.dev";

// Create transporter
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for 587
  auth: smtpUser && smtpPassword ? {
    user: smtpUser,
    pass: smtpPassword,
  } : undefined,
});

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  // Fallback if SMTP config is missing in dev mode
  if (!smtpUser || !smtpPassword) {
    console.warn("\n📝 [SMTP Config Missing] Email would have been sent:");
    console.warn(`   To:      ${to}`);
    console.warn(`   Subject: ${subject}`);
    console.warn(`   Text:    ${text}\n`);
    return { success: true, mocked: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"AssetFlow ERP" <${fromEmail}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    });

    console.log(`✉️ Email successfully sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
}
