"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("⏳ Loading data for Customer Assets...");
    const company = await prisma.company.findFirst({
        where: { name: "Ignite Consultancy" },
    });
    if (!company)
        throw new Error("Ignite Consultancy not found");
    const customers = await prisma.customer.findMany({
        where: { companyId: company.id },
    });
    if (!customers.length)
        throw new Error("❌ No customers found.");
    const sites = await prisma.site.findMany({
        where: { companyId: company.id },
    });
    if (!sites.length)
        throw new Error("❌ No sites found.");
    // wipe in correct order:
    await prisma.assetTestHistory.deleteMany({});
    await prisma.customerAsset.deleteMany({});
    console.log("🧹 Cleared AssetTestHistory and CustomerAsset tables");
    let idCounter = 8001;
    const assetTypes = [
        { id: 1, name: "Fire Alarm Panel" },
        { id: 2, name: "Smoke Detector" },
        { id: 3, name: "HVAC Unit" },
        { id: 4, name: "Boiler" },
        { id: 5, name: "CCTV Camera" },
    ];
    for (const customer of customers) {
        const customerSites = sites.filter((s) => s.customerId === customer.id);
        const site = customerSites.length ? customerSites[0] : sites[0];
        for (let i = 0; i < 5; i++) {
            const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)];
            await prisma.customerAsset.create({
                data: {
                    id: idCounter++,
                    companyId: company.id,
                    // Foreign keys
                    customerId: customer.id,
                    siteId: site?.id ?? null,
                    // CORE INFO
                    assetNumber: `AST-${idCounter}`,
                    name: assetType.name,
                    manufacturer: "Siemens",
                    model: `Model-${Math.floor(Math.random() * 900)}`,
                    serialNumber: `SN-${Math.floor(Math.random() * 999999)}`,
                    status: "Active",
                    // TYPE
                    assetTypeId: assetType.id,
                    assetTypeName: assetType.name,
                    // ORDERING
                    displayOrder: i + 1,
                    parentId: null,
                    // CUSTOMER CONTRACT
                    contractId: 500 + i,
                    contractName: "Maintenance Contract",
                    contractStartDate: new Date("2023-01-01"),
                    contractEndDate: new Date("2026-01-01"),
                    contractNo: `MC-${idCounter}`,
                    contractExpired: false,
                    // DATES
                    startDate: new Date("2023-03-01"),
                    lastServiceDate: new Date("2024-03-01"),
                    nextServiceDate: new Date("2025-03-01"),
                    dateModified: new Date(),
                    lastSynced: new Date(),
                    // LAST TEST
                    lastTestResult: "Pass",
                    lastTestDate: new Date("2024-02-20"),
                    lastTestServiceLevelId: 10,
                    lastTestServiceLevelName: "Annual Test",
                    // FLAGS
                    archived: false,
                    // FINANCIALS
                    purchaseValue: "1200.00",
                    replacementCost: "4000.00",
                },
            });
        }
    }
    console.log("✅ Seed 7 — Customer Assets created (5 per customer)");
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
