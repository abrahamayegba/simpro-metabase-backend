/**
 * SEED 1B — SITES
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({
    where: { name: "Ignite Consultancy" },
  });

  if (!company) throw new Error("Ignite Consultancy not found");

  const customers = await prisma.customer.findMany({
    where: { companyId: company.id },
  });

  if (customers.length === 0)
    throw new Error("❌ No customers found. Run the Customer seed first.");

  // wipe sites
  await prisma.site.deleteMany({});
  console.log("🧹 Cleared Sites table");

  let idCounter = 2001;

  for (const customer of customers) {
    // HQ
    await prisma.site.create({
      data: {
        id: idCounter++,
        companyId: company.id,
        customerId: customer.id,

        name: customer.companyName + " HQ",

        address: "10 Main Street",
        city: "Glasgow",
        state: "Scotland",
        postalCode: "G1 1AB",
        country: "UK",

        billingAddress: "10 Billing Road",
        billingCity: "Glasgow",
        billingState: "Scotland",
        billingPostalCode: "G1 2CD",
        billingCountry: "UK",

        billingContact: "Accounts Dept",

        primaryContactId: 1,
        primaryContactGivenName: "John",
        primaryContactFamilyName: "Doe",
        primaryContactEmail: "john@example.com",
        primaryContactTitle: "Facilities Manager",
        primaryContactWorkPhone: "0141 555 1111",
        primaryContactCellPhone: "07700 111111",
        primaryContactFax: "0141 000 2222",
        primaryContactPosition: "Manager",
        primaryContactNotification: "email",

        publicNotes: "Main head office site.",
        privateNotes: "VIP client.",

        zoneId: 10,
        zoneName: "Zone A",

        stcZone: 1,
        veecZone: "A",

        serviceFeeId: 5,
        serviceFeeName: "Standard Fee",

        archived: false,

        latitude: "55.860916",
        longitude: "-4.251433",

        dateCreated: new Date(),
        dateModified: new Date(),
        lastSynced: new Date(),
      },
    });

    // Warehouse
    await prisma.site.create({
      data: {
        id: idCounter++,
        companyId: company.id,
        customerId: customer.id,

        name: customer.companyName + " Warehouse",

        address: "50 Industrial Road",
        city: "Glasgow",
        state: "Scotland",
        postalCode: "G2 9XY",
        country: "UK",

        billingAddress: "50 Finance Road",
        billingCity: "Glasgow",
        billingState: "Scotland",
        billingPostalCode: "G2 8ZZ",
        billingCountry: "UK",

        billingContact: "Warehouse Admin",

        primaryContactId: 2,
        primaryContactGivenName: "Sarah",
        primaryContactFamilyName: "Smith",
        primaryContactEmail: "sarah@example.com",
        primaryContactTitle: "Warehouse Manager",
        primaryContactWorkPhone: "0141 555 2222",
        primaryContactCellPhone: "07700 222222",
        primaryContactFax: "0141 000 3333",
        primaryContactPosition: "Supervisor",
        primaryContactNotification: "sms",

        publicNotes: "Warehouse location.",
        privateNotes: "Handles large equipment.",

        zoneId: 11,
        zoneName: "Zone B",

        stcZone: 2,
        veecZone: "B",

        serviceFeeId: 6,
        serviceFeeName: "Warehouse Fee",

        archived: false,

        latitude: "55.8642",
        longitude: "-4.2518",

        dateCreated: new Date(),
        dateModified: new Date(),
        lastSynced: new Date(),
      },
    });
  }

  console.log("✅ Seed 1B — Sites created successfully");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
