import db from "./lib/db";

async function main() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  });
  
  if (users.length === 0) {
    console.log("No users found in database.");
    return;
  }
  
  console.log("Found recent users:");
  users.forEach((u, i) => {
    console.log(`${i + 1}: ${u.name} (${u.email}) - Current Role: ${u.role}`);
  });
  
  const latestUser = users[0];
  console.log(`Promoting latest user: ${latestUser.name} (${latestUser.email}) to ADMIN...`);
  
  const updatedUser = await db.user.update({
    where: { id: latestUser.id },
    data: { role: "ADMIN", status: "ACTIVE" }
  });
  
  console.log(`Successfully promoted ${updatedUser.name} to ADMIN!`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
