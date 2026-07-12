/**
 * seed-demo-accounts.ts
 * 
 * Seeds demo accounts using Better Auth's own API (auth.api.signUpEmail) so that
 * password hashes are in the correct format (scrypt) that Better Auth can verify.
 * 
 * Run: bun seed-demo-accounts.ts
 */
import { auth } from "./lib/auth";
import db from "./lib/db";

const DEMO_ACCOUNTS = [
  { name: "Admin Demo",         email: "demo.admin@assetflow.dev",    role: "ADMIN",           password: "Demo@Admin123" },
  { name: "Asset Manager Demo", email: "demo.manager@assetflow.dev",  role: "ASSET_MANAGER",   password: "Demo@Manager123" },
  { name: "Dept Head Demo",     email: "demo.head@assetflow.dev",     role: "DEPARTMENT_HEAD", password: "Demo@Head123" },
  { name: "Employee Demo",      email: "demo.employee@assetflow.dev", role: "EMPLOYEE",        password: "Demo@Employee123" },
];

async function main() {
  console.log("Setting up demo accounts via Better Auth...\n");

  for (const demo of DEMO_ACCOUNTS) {
    // 1. Fully wipe existing user + all related records so Better Auth recreates cleanly
    const existingUser = await db.user.findFirst({ where: { email: demo.email } });
    if (existingUser) {
      await db.session.deleteMany({ where: { userId: existingUser.id } });
      await db.account.deleteMany({ where: { userId: existingUser.id } });
      await db.user.delete({ where: { id: existingUser.id } });
    }

    // 2. Sign up via Better Auth — uses correct scrypt hash format for passwords
    const res = await auth.api.signUpEmail({
      body: { email: demo.email, password: demo.password, name: demo.name },
    });

    if (!res?.user) {
      console.log(`❌ Failed to create: ${demo.email}`);
      continue;
    }

    // 3. Promote role (Better Auth defaults new users to EMPLOYEE)
    await db.user.update({
      where: { id: res.user.id },
      data: { role: demo.role as any, status: "ACTIVE", emailVerified: true },
    });

    console.log(`✓  ${demo.email.padEnd(38)} → ${demo.role}`);
  }

  console.log("\nDemo accounts ready:");
  DEMO_ACCOUNTS.forEach(a => {
    console.log(`  ${a.role.padEnd(17)} | ${a.email} | ${a.password}`);
  });
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
