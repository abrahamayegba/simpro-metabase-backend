import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("⏳ Loading data for Contractor Jobs...");

  const company = await prisma.company.findFirst({
    where: { name: "Ignite Consultancy" },
  });

  if (!company) throw new Error("Ignite Consultancy not found");

  const jobs = await prisma.job.findMany({
    where: { companyId: company.id },
  });

  if (!jobs.length) throw new Error("❌ No jobs found. Run job seed first.");

  const employees = await prisma.employee.findMany({
    where: { companyId: company.id },
  });

  if (!employees.length) throw new Error("❌ No employees found.");

  // wipe
  await prisma.contractorJob.deleteMany({});
  console.log("🧹 Cleared ContractorJob table");

  let idCounter = 7001;

  // Always 5 contractor jobs per Job
  const contractorTemplates = [
    { projectType: "Electrical", status: "Pending" },
    { projectType: "Mechanical", status: "In Progress" },
    { projectType: "Fire Safety", status: "Completed" },
    { projectType: "HVAC", status: "Approved" },
    { projectType: "Security", status: "Draft" },
  ];

  for (const job of jobs) {
    for (const t of contractorTemplates) {
      const createdByEmp =
        employees[Math.floor(Math.random() * employees.length)];

      await prisma.contractorJob.create({
        data: {
          id: idCounter++,
          jobId: job.id,
          companyId: company.id,

          // CORE INFO
          projectType: t.projectType,
          description: `${t.projectType} contractor work for ${job.name}`,
          status: t.status,

          // CONTRACTOR DETAILS
          contractorId: Math.floor(Math.random() * 9999),
          contractorName: `${t.projectType} Contractor Ltd`,
          contractorContact: "0141 777 0000",

          // CREATED BY
          createdById: createdByEmp.id,
          createdByName: createdByEmp.name,
          createdByType: "Employee",
          createdByTypeId: createdByEmp.id,

          // MATERIALS / LABOUR
          contractorSupplyMaterials: true,
          materials: "400.00",
          labor: "350.00",

          // FINANCIALS
          currency: "GBP",
          exchangeRate: "1.000000",

          // TAX CODE
          taxCodeId: 20,
          taxCodeCode: "TC20",
          taxCodeType: "Standard",
          taxCodeRate: "20.00",

          // RETENTION
          retentionAmount: "50.00",
          retentionPerClaim: "10.00",
          retentionPeriodMonths: 12,

          // TOTALS
          totalExTax: "750.00",
          totalIncTax: "900.00",
          reverseChargeTax: "0.00",
          contractedAmount: "800.00",

          // DATES
          dateIssued: new Date(),
          dueDate: new Date(Date.now() + 7 * 86400000),
          dateModified: new Date(),
          lastSynced: new Date(),
        },
      });
    }
  }

  console.log("✅ Seed 6 — Contractor Jobs created (5 per job)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
