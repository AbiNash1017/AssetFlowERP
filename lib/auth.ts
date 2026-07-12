import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import db from "./db";

import { sendEmail } from "./mail";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your AssetFlow ERP password",
        text: `Hello ${user.name},\n\nYou requested to reset your password. Click the link below to set a new password:\n\n${url}\n\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nAssetFlow ERP Team`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; color: #1f2937;">
            <h2 style="font-size: 20px; font-weight: bold; margin-top: 0; color: #6b21a8;">Reset Your AssetFlow ERP Password</h2>
            <p>Hello ${user.name},</p>
            <p>We received a request to reset the password for your AssetFlow account. Click the button below to recover your credentials:</p>
            <div style="margin: 24px 0; text-align: center;">
              <a href="${url}" style="background-color: #6b21a8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">
              If you did not request a password reset, you can safely ignore this email. This link will expire shortly.
            </p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 11px; color: #9ca3af; margin-bottom: 0;">AssetFlow ERP System &copy; ${new Date().getFullYear()}</p>
          </div>
        `,
      });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "EMPLOYEE",
        input: false, // Prevents users from manually setting role at signup
      },
      status: {
        type: "string",
        defaultValue: "ACTIVE",
        input: false, // Prevents users from setting status
      },
      departmentId: {
        type: "string",
        required: false,
        input: false,
      }
    }
  }
});
export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
