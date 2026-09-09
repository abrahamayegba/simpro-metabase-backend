"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // CHILD TABLES FIRST (those referencing others)
    await prisma.assetTestHistory.deleteMany({});
    await prisma.jobCostCenter.deleteMany({});
    await prisma.contractorJob.deleteMany({});
    await prisma.customerAsset.deleteMany({});
    await prisma.quote.deleteMany({});
    await prisma.job.deleteMany({});
    await prisma.site.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.employee.deleteMany({});
    // SIMPRO INTEGRATION TABLE
    await prisma.integration.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.passwordReset.deleteMany({});
    await prisma.userCompany.deleteMany({});
    await prisma.role.deleteMany({});
    // ROOT ENTITIES LAST
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});
}
main()
    .then(async () => {
    console.log("Database wiped.");
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
