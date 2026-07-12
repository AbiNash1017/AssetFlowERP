import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import db from "./db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
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
