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
    await prisma.job.deleteMany({});
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
