"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("⏳ Loading data for Asset Test History...");
    const company = await prisma.company.findFirst({
        where: { name: "Ignite Consultancy" },
    });
    if (!company)
        throw new Error("Ignite Consultancy not found");
    const assets = await prisma.customerAsset.findMany({
        where: { companyId: company.id },
    });
    if (!assets.length)
        throw new Error("❌ No customer assets found. Run asset seed first.");
    const employees = await prisma.employee.findMany({
        where: { companyId: company.id },
    });
    if (!employees.length)
        throw new Error("❌ No employees found.");
    const jobs = await prisma.job.findMany({
        where: { companyId: company.id },
    });
    const quotes = await prisma.quote.findMany({
        where: { companyId: company.id },
    });
    // wipe tests
    await prisma.assetTestHistory.deleteMany({});
    console.log("🧹 Cleared AssetTestHistory table");
    let count = 0;
    for (const asset of assets) {
        for (let i = 0; i < 5; i++) {
            const testEmp = employees[Math.floor(Math.random() * employees.length)];
            const jobLink = jobs[Math.floor(Math.random() * jobs.length)];
            const quoteLink = quotes[Math.floor(Math.random() * quotes.length)];
            const testDate = new Date(Date.now() - (i + 1) * 30 * 86400000);
            const nextTestDate = new Date(Date.now() + (i + 1) * 30 * 86400000);
            await prisma.assetTestHistory.create({
                data: {
                    assetId: asset.id,
                    companyId: company.id,
                    // BASIC TEST
                    testDate,
                    nextTestDate,
                    testEmployeeId: testEmp.id,
                    testEmployeeName: testEmp.name,
                    testNotes: "Routine maintenance test",
                    testResult: i % 2 === 0 ? "Pass" : "Fail",
                    // SERVICE LEVEL
                    serviceLevelId: 10 + i,
                    serviceLevelName: `Level ${10 + i}`,
                    // JOB LINK
                    jobId: jobLink.id,
                    jobDateIssued: jobLink.dateIssued ?? new Date(),
                    jobDueDate: jobLink.dueDate ?? new Date(Date.now() + 2 * 86400000),
                    // QUOTE LINK
                    quoteId: quoteLink.id,
                    quoteDateIssued: quoteLink.dateIssued ?? new Date(),
                    quoteDueDate: quoteLink.dueDate ?? new Date(Date.now() + 5 * 86400000),
                    // STATUS
                    testStatus: i % 2 === 0 ? "Completed" : "Requires Attention",
                    passOrFail: i % 2 === 0 ? "Pass" : "Fail",
                    dateModified: new Date(),
                    lastSynced: new Date(),
                },
            });
            count++;
        }
    }
    console.log(`✅ Seed 9 — Created ${count} Asset Test History records (5 per asset)`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
