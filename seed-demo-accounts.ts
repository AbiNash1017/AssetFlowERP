/**
 * seed-demo-accounts.ts
 * 
 * Seeds demo accounts and realistic demo data for all entities.
 * Password hashes are created via Better Auth's signUpEmail so they verify correctly.
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
  console.log("Cleaning up existing database records...");
  
  // Wipe all dependent records first to avoid foreign key violations
  await db.activityLog.deleteMany({});
  await db.notification.deleteMany({});
  await db.auditEntry.deleteMany({});
  await db.auditAssignment.deleteMany({});
  await db.auditCycle.deleteMany({});
  await db.maintenanceRequest.deleteMany({});
  await db.booking.deleteMany({});
  await db.transferRequest.deleteMany({});
  await db.allocation.deleteMany({});
  await db.asset.deleteMany({});
  await db.assetCategory.deleteMany({});
  await db.department.deleteMany({});
  await db.session.deleteMany({});
  await db.account.deleteMany({});
  await db.user.deleteMany({});

  console.log("Setting up demo accounts via Better Auth...\n");

  const createdUsers: Record<string, any> = {};

  for (const demo of DEMO_ACCOUNTS) {
    // Sign up via Better Auth — uses correct scrypt hash format for passwords
    const res = await auth.api.signUpEmail({
      body: { email: demo.email, password: demo.password, name: demo.name },
    });

    if (!res?.user) {
      console.log(`❌ Failed to create: ${demo.email}`);
      continue;
    }

    // Promote role (Better Auth defaults new users to EMPLOYEE)
    const updatedUser = await db.user.update({
      where: { id: res.user.id },
      data: { role: demo.role as any, status: "ACTIVE", emailVerified: true },
    });

    createdUsers[demo.role] = updatedUser;
    console.log(`✓  ${demo.email.padEnd(38)} → ${demo.role}`);
  }

  const employee = createdUsers["EMPLOYEE"];
  const manager = createdUsers["ASSET_MANAGER"];
  const head = createdUsers["DEPARTMENT_HEAD"];
  const admin = createdUsers["ADMIN"];

  if (!employee || !manager || !head || !admin) {
    console.log("Error: One or more demo users could not be created.");
    return;
  }

  console.log("\nSeeding Departments...");
  const itDept = await db.department.create({
    data: {
      name: "Information Technology",
      code: "IT-DEPT",
      status: "ACTIVE",
      headId: head.id,
    },
  });

  const hrDept = await db.department.create({
    data: {
      name: "Human Resources",
      code: "HR-DEPT",
      status: "ACTIVE",
    },
  });

  const opsDept = await db.department.create({
    data: {
      name: "Operations",
      code: "OPS-DEPT",
      status: "ACTIVE",
    },
  });

  // Associate users with IT Department
  await db.user.update({
    where: { id: employee.id },
    data: { departmentId: itDept.id },
  });
  await db.user.update({
    where: { id: head.id },
    data: { departmentId: itDept.id },
  });
  await db.user.update({
    where: { id: manager.id },
    data: { departmentId: itDept.id },
  });

  console.log("Seeding Asset Categories...");
  const laptopCat = await db.assetCategory.create({
    data: {
      name: "Laptops",
      description: "Company work laptops and accessories",
      customFields: {
        Processor: "string",
        RAM: "string",
        Storage: "string",
      },
    },
  });

  const monitorCat = await db.assetCategory.create({
    data: {
      name: "Monitors",
      description: "Office desk display monitors",
      customFields: {
        Resolution: "string",
        Size: "string",
      },
    },
  });

  const conferenceCat = await db.assetCategory.create({
    data: {
      name: "Conference Rooms",
      description: "Bookable meeting spaces and office hubs",
      customFields: {
        Capacity: "number",
        Projector: "boolean",
      },
    },
  });

  console.log("Seeding Assets...");
  const laptop1 = await db.asset.create({
    data: {
      assetTag: "AF-0014",
      name: "MacBook Pro 16",
      categoryId: laptopCat.id,
      serialNumber: "SN-MAC-0014",
      acquisitionDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
      acquisitionCost: 2499.00,
      condition: "EXCELLENT",
      location: "San Francisco HQ",
      status: "ALLOCATED",
      isBookable: false,
      documents: {
        Processor: "Apple M3 Pro",
        RAM: "18GB",
        Storage: "512GB SSD",
      },
    },
  });

  const laptop2 = await db.asset.create({
    data: {
      assetTag: "AF-0015",
      name: "ThinkPad T14 Gen 4",
      categoryId: laptopCat.id,
      serialNumber: "SN-THINK-0015",
      acquisitionDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      acquisitionCost: 1299.50,
      condition: "GOOD",
      location: "New York Office",
      status: "AVAILABLE",
      isBookable: false,
      documents: {
        Processor: "AMD Ryzen 7",
        RAM: "16GB",
        Storage: "512GB SSD",
      },
    },
  });

  const laptop3 = await db.asset.create({
    data: {
      assetTag: "AF-0021",
      name: "Dell XPS 15",
      categoryId: laptopCat.id,
      serialNumber: "SN-DELL-0021",
      acquisitionDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      acquisitionCost: 1899.00,
      condition: "FAIR",
      location: "Chicago Office",
      status: "LOST",
      isBookable: false,
      documents: {
        Processor: "Intel Core i7",
        RAM: "32GB",
        Storage: "1TB SSD",
      },
    },
  });

  const monitor1 = await db.asset.create({
    data: {
      assetTag: "AF-0055",
      name: "Dell UltraSharp 27",
      categoryId: monitorCat.id,
      serialNumber: "SN-DELL-0055",
      acquisitionDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      acquisitionCost: 450.00,
      condition: "EXCELLENT",
      location: "San Francisco HQ",
      status: "AVAILABLE",
      isBookable: false,
      documents: {
        Resolution: "4K UHD (3840x2160)",
        Size: "27 inches",
      },
    },
  });

  const monitor2 = await db.asset.create({
    data: {
      assetTag: "AF-0088",
      name: "LG UltraWide 34",
      categoryId: monitorCat.id,
      serialNumber: "SN-LG-0088",
      acquisitionDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      acquisitionCost: 650.00,
      condition: "DAMAGED",
      location: "San Francisco HQ",
      status: "AVAILABLE",
      isBookable: false,
      documents: {
        Resolution: "UWQHD (3440x1440)",
        Size: "34 inches",
      },
    },
  });

  const roomB2 = await db.asset.create({
    data: {
      assetTag: "AF-0100",
      name: "Conference Room B2",
      categoryId: conferenceCat.id,
      serialNumber: "SN-ROOM-B2",
      acquisitionDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
      acquisitionCost: 5000.00,
      condition: "EXCELLENT",
      location: "Main Block, 2nd Floor",
      status: "AVAILABLE",
      isBookable: true,
      documents: {
        Capacity: "8",
        Projector: true,
      },
    },
  });

  console.log("Seeding Allocations & Overdue Returns...");
  // Active Allocation
  const alloc1 = await db.allocation.create({
    data: {
      assetId: laptop1.id,
      userId: employee.id,
      allocatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      expectedReturnDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // in 10 days
      status: "ACTIVE",
    },
  });

  // Overdue return
  const alloc2 = await db.allocation.create({
    data: {
      assetId: laptop3.id,
      userId: employee.id,
      allocatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      expectedReturnDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // expected 3 days ago
      status: "OVERDUE",
    },
  });

  console.log("Seeding Transfer Requests...");
  await db.transferRequest.create({
    data: {
      assetId: laptop1.id,
      fromUserId: employee.id,
      toUserId: head.id,
      requestedById: employee.id,
      status: "PENDING",
      notes: "Transferring laptop for department head usage in operations review.",
    },
  });

  console.log("Seeding Bookings...");
  // Ongoing booking
  await db.booking.create({
    data: {
      assetId: roomB2.id,
      userId: employee.id,
      title: "Product Strategy Meet",
      startTime: new Date(Date.now() - 30 * 60 * 1000), // started 30 mins ago
      endTime: new Date(Date.now() + 60 * 60 * 1000), // ends in 1 hour
      status: "ONGOING",
    },
  });

  // Upcoming booking
  await db.booking.create({
    data: {
      assetId: roomB2.id,
      userId: head.id,
      title: "Q3 Department All-Hands",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      endTime: new Date(Date.now() + 25.5 * 60 * 60 * 1000),
      status: "UPCOMING",
    },
  });

  console.log("Seeding Maintenance Requests...");
  // Resolved request
  await db.maintenanceRequest.create({
    data: {
      assetId: monitor1.id,
      raisedById: employee.id,
      issue: "Screen flickers periodically when connected via HDMI",
      priority: "MEDIUM",
      status: "RESOLVED",
      approvedById: admin.id,
      resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  // Active in-progress request
  await db.maintenanceRequest.create({
    data: {
      assetId: monitor2.id,
      raisedById: employee.id,
      issue: "Mount stand bracket cracked, monitor cannot be kept standing.",
      priority: "HIGH",
      status: "IN_PROGRESS",
    },
  });

  console.log("Seeding Audit Cycles...");
  const auditCycle = await db.auditCycle.create({
    data: {
      name: "Q3 IT Inventory Audit",
      scope: "LOCATION",
      scopeId: "San Francisco HQ",
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      createdById: manager.id,
    },
  });

  await db.auditAssignment.create({
    data: {
      cycleId: auditCycle.id,
      auditorId: head.id,
    },
  });

  await db.auditEntry.create({
    data: {
      cycleId: auditCycle.id,
      assetId: laptop1.id,
      auditorId: head.id,
      result: "VERIFIED",
      notes: "Asset in excellent condition and with assigned user.",
    },
  });

  await db.auditEntry.create({
    data: {
      cycleId: auditCycle.id,
      assetId: monitor2.id,
      auditorId: head.id,
      result: "DAMAGED",
      notes: "Stand bracket broken.",
    },
  });

  console.log("Seeding Activity Logs & Notifications...");
  // Log entries
  await db.activityLog.create({
    data: {
      userId: manager.id,
      action: "REGISTER_ASSET",
      entityType: "Asset",
      entityId: laptop1.id,
      metadata: { name: laptop1.name, assetTag: laptop1.assetTag },
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  await db.activityLog.create({
    data: {
      userId: manager.id,
      action: "ALLOCATE_ASSET",
      entityType: "Allocation",
      entityId: alloc1.id,
      metadata: { userId: employee.id, assetTag: laptop1.assetTag },
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  await db.activityLog.create({
    data: {
      userId: employee.id,
      action: "CREATE_BOOKING",
      entityType: "Booking",
      entityId: roomB2.id,
      metadata: { title: "Product Strategy Meet" },
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  });

  // Notifications
  await db.notification.create({
    data: {
      userId: employee.id,
      type: "ALLOCATION",
      title: "Asset MacBook Pro 16 Assigned",
      message: "Laptop AF-0014 assigned to Priya shah",
      read: false,
      entityType: "Asset",
      entityId: laptop1.id,
      createdAt: new Date(Date.now() - 2 * 60 * 1000),
    },
  });

  await db.notification.create({
    data: {
      userId: employee.id,
      type: "MAINTENANCE_APPROVED",
      title: "Maintenance Request Approved",
      message: "Maintenance request AF-0055 approved",
      read: true,
      entityType: "Asset",
      entityId: monitor1.id,
      createdAt: new Date(Date.now() - 18 * 60 * 1000),
    },
  });

  await db.notification.create({
    data: {
      userId: employee.id,
      type: "BOOKING_CONFIRMED",
      title: "Meeting Room Booking Confirmed",
      message: "Booking confirmed : Room B2 : 2:00 to 3:00 PM",
      read: false,
      entityType: "Asset",
      entityId: roomB2.id,
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
    },
  });

  await db.notification.create({
    data: {
      userId: manager.id,
      type: "OVERDUE_ALERT",
      title: "Asset Allocation Return Overdue",
      message: "Overdue return : AF-0021 was due 3 days ago",
      read: false,
      entityType: "Asset",
      entityId: laptop3.id,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  console.log("\n✓ Seeding finished successfully! All tables fully populated.");
  console.log("\nDemo accounts ready:");
  DEMO_ACCOUNTS.forEach(a => {
    console.log(`  ${a.role.padEnd(17)} | ${a.email} | ${a.password}`);
  });
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
