import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.create({
    data: {
      name: "Virtual Facility Services",
      email: "virtualfacilityservices.co.uk",
      industry: "General",
    },
  });

  // ---------------------------------------------------
  // 2. Create role (Admin)
  // ---------------------------------------------------
  const adminRole = await prisma.role.create({
    data: {
      name: "admin",
    },
  });

  // ---------------------------------------------------
  // 3. Create user
  // ---------------------------------------------------
  const passwordHash = await bcrypt.hash("Amo9uss&", 10);

  const user = await prisma.user.create({
    data: {
      name: "Abraham Ayegba",
      email: "abraham.ayegba@virtualservicesgroup.co.uk",
      passwordHash,
    },
  });

  // ---------------------------------------------------
  // 4. Link User ↔ Company with Admin role
  // ---------------------------------------------------
  await prisma.userCompany.create({
    data: {
      userId: user.id,
      companyId: company.id,
      roleId: adminRole.id,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
