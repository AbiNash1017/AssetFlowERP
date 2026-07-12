import db from "./lib/db";
import bcrypt from "bcryptjs";

const DEMO_ACCOUNTS = [
  { name: "Admin Demo",         email: "demo.admin@assetflow.dev",    role: "ADMIN",            password: "Demo@Admin123" },
  { name: "Asset Manager Demo", email: "demo.manager@assetflow.dev",  role: "ASSET_MANAGER",    password: "Demo@Manager123" },
  { name: "Dept Head Demo",     email: "demo.head@assetflow.dev",     role: "DEPARTMENT_HEAD",  password: "Demo@Head123" },
  { name: "Employee Demo",      email: "demo.employee@assetflow.dev", role: "EMPLOYEE",         password: "Demo@Employee123" },
];

async function main() {
  console.log("Setting up demo accounts...");
  
  for (const account of DEMO_ACCOUNTS) {
    const existing = await db.user.findFirst({ where: { email: account.email } });
    
    if (existing) {
      // Update role & ensure active
      await db.user.update({
        where: { id: existing.id },
        data: { role: account.role as any, status: "ACTIVE", name: account.name },
      });
      console.log(`✓ Updated existing: ${account.email} → ${account.role}`);
    } else {
      // Hash password manually and create user directly in DB
      // (Better Auth stores passwords in the account table)
      // We'll insert into user + account tables
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      const user = await db.user.create({
        data: {
          name: account.name,
          email: account.email,
          emailVerified: true,
          role: account.role as any,
          status: "ACTIVE",
        },
      });
      
      // Create the credential account record Better Auth expects
      await db.account.create({
        data: {
          id: crypto.randomUUID(),
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      console.log(`✓ Created: ${account.email} → ${account.role}`);
    }
  }
  
  console.log("\nDemo accounts ready:");
  DEMO_ACCOUNTS.forEach(a => {
    console.log(`  Role: ${a.role.padEnd(15)} | Email: ${a.email} | Password: ${a.password}`);
  });
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
