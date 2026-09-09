/**
 * SEED 2 — EMPLOYEES
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({
    where: { name: "Ignite Consultancy" },
  });

  if (!company) {
    throw new Error("❌ Ignite Consultancy not found");
  }

  // wipe all
  await prisma.employee.deleteMany({});
  console.log("🧹 Cleared Employee table");

  let idCounter = 3001;

  const employees = [
    {
      name: "Abraham Ayegba",
      position: "Software Engineer",
      email: "abraham@ignite-consultancy.co.uk",
      city: "Glasgow",
    },
    {
      name: "Sarah Thompson",
      position: "Operations Manager",
      email: "sarah.thompson@ignite-consultancy.co.uk",
      city: "Glasgow",
    },
    {
      name: "Mark Henderson",
      position: "Lead Engineer",
      email: "mark.henderson@ignite-consultancy.co.uk",
      city: "Edinburgh",
    },
    {
      name: "Tom Kelly",
      position: "Service Engineer",
      email: "tom.kelly@ignite-consultancy.co.uk",
      city: "Glasgow",
    },
    {
      name: "Lewis Fraser",
      position: "Junior Engineer",
      email: "lewis.fraser@ignite-consultancy.co.uk",
      city: "Paisley",
    },
    {
      name: "Emily Clark",
      position: "Office Support",
      email: "emily.clark@ignite-consultancy.co.uk",
      city: "Glasgow",
    },
  ];

  for (const emp of employees) {
    await prisma.employee.create({
      data: {
        id: idCounter++,
        companyId: company.id,

        // basic
        name: emp.name,
        position: emp.position,
        email: emp.email,
        secondaryEmail: emp.email.replace("@", ".aux@"),
        workPhone: "0141 500 1001",
        extension: "221",
        cellPhone: "07400 123456",
        fax: "0141 000 1111",
        preferredNotificationMethod: "email",

        // address
        address: "10 Main Street",
        city: emp.city,
        state: "Scotland",
        postalCode: "G1 2AB",
        country: "UK",

        // dates
        dateOfHire: new Date("2022-01-10"),
        dateOfBirth: new Date("1990-04-12"),
        dateCreated: new Date(),
        dateModified: new Date(),

        // roles
        isSalesperson: false,
        isProjectManager: emp.position.includes("Manager"),
        archived: false,

        // emergency contact
        emergencyContactName: "John Doe",
        emergencyContactRelationship: "Friend",
        emergencyContactWorkPhone: "0141 555 9999",
        emergencyContactCellPhone: "07700 888888",
        emergencyContactAltPhone: "0141 555 7777",
        emergencyContactAddress: "20 Queen Street, Glasgow",

        // account setup
        username: emp.email.split("@")[0],
        isMobility: true,
        securityGroupId: 1,
        securityGroupName: "Default Security Group",
        mobileSecurityGroupId: 2,
        mobileSecurityGroupName: "Mobile Default",

        // user profile
        storageDeviceId: 10,
        storageDeviceName: "iPhone 14",
        preferredLanguage: "en_GB",

        // defaults
        defaultZoneId: 100,
        defaultZoneName: "Zone A",
        defaultCompanyId: 1,
        defaultCompanyName: "Ignite HQ",

        // pay data
        payRate: "25.00",
        employmentCost: "32.00",
        overheadCost: "10.00",

        // banking
        bankAccountName: emp.name,
        bankRoutingNo: "12-34-56",
        bankAccountNo: "12345678",

        lastSynced: new Date(),
      },
    });
  }

  console.log("✅ Seed 2 — Employees created");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
