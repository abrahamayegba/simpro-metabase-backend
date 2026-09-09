"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("⏳ Loading data for Job Cost Centers...");
    const company = await prisma.company.findFirst({
        where: { name: "Ignite Consultancy" },
    });
    if (!company)
        throw new Error("Ignite Consultancy not found");
    const jobs = await prisma.job.findMany({
        where: { companyId: company.id },
    });
    if (!jobs.length)
        throw new Error("❌ No jobs found. Run the job seed first.");
    // wipe
    await prisma.jobCostCenter.deleteMany({});
    console.log("🧹 Cleared JobCostCenter table");
    let idCounter = 6001;
    // 5 templates (always 5)
    const templates = [
        { name: "Labour", header: "Labour Tasks", stage: "Active" },
        { name: "Materials", header: "Materials Cost", stage: "Pending" },
        { name: "Equipment", header: "Plant & Equipment", stage: "In Progress" },
        { name: "Subcontractor", header: "Subcontract Work", stage: "Review" },
        { name: "Miscellaneous", header: "Other Costs", stage: "Draft" },
    ];
    for (const job of jobs) {
        for (const t of templates) {
            await prisma.jobCostCenter.create({
                data: {
                    id: idCounter++,
                    jobId: job.id,
                    companyId: company.id,
                    // BASIC INFO
                    costCenterId: Math.floor(Math.random() * 1000),
                    costCenterName: t.name,
                    name: `${t.name} Cost Center`,
                    header: t.header,
                    description: `Seeded ${t.name} cost center`,
                    notes: "Seeded record",
                    orderNo: `CC-${idCounter}`,
                    // SITE (metadata only)
                    siteId: job.siteId ?? null,
                    siteName: job.siteName ?? null,
                    // STATUS + FLAGS
                    stage: t.stage,
                    autoAdjustDates: false,
                    displayOrder: 1,
                    variation: false,
                    variationApprovalDate: null,
                    itemsLocked: false,
                    lockedType: "none",
                    lockedIsLocked: false,
                    // DATE RANGE
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 5 * 86400000),
                    // TOTALS
                    totalExTax: "500.00",
                    totalTax: "100.00",
                    totalIncTax: "600.00",
                    // TAX CODE
                    taxCodeId: 10,
                    taxCodeCode: "TC20",
                    taxCodeType: "Standard",
                    taxCodeRate: "20.00",
                    // CLAIMED
                    claimedPercentToDate: "30.00",
                    claimedExTaxToDate: "150.00",
                    claimedIncTaxToDate: "180.00",
                    claimedPercentRemaining: "70.00",
                    claimedExTaxRemaining: "350.00",
                    claimedIncTaxRemaining: "420.00",
                    // MATERIAL COSTS
                    materialsCostActual: "120.00",
                    materialsCostCommitted: "30.00",
                    materialsCostEstimate: "100.00",
                    materialsCostRevised: "140.00",
                    // RESOURCE COSTS
                    resourcesCostActual: "80.00",
                    resourcesCostCommitted: "15.00",
                    resourcesCostEstimate: "70.00",
                    resourcesCostRevised: "90.00",
                    // LABOR
                    laborActual: "60.00",
                    laborCommitted: "10.00",
                    laborEstimate: "50.00",
                    laborRevised: "70.00",
                    // LABOR HOURS
                    laborHoursActual: "5.00",
                    laborHoursCommitted: "1.00",
                    laborHoursEstimate: "4.00",
                    laborHoursRevised: "6.00",
                    // PLANT
                    plantActual: "40.00",
                    plantCommitted: "10.00",
                    plantEstimate: "30.00",
                    plantRevised: "50.00",
                    plantHoursActual: "2.00",
                    plantHoursEstimate: "1.50",
                    plantHoursRevised: "2.50",
                    // COMMISSION
                    commissionActual: "0.00",
                    commissionEstimate: "0.00",
                    commissionRevised: "0.00",
                    // OVERHEAD
                    overheadActual: "25.00",
                    overheadCommitted: "5.00",
                    overheadEstimate: "20.00",
                    overheadRevised: "30.00",
                    // MARKUPS
                    materialsMarkupActual: "8.00",
                    materialsMarkupEstimate: "7.00",
                    materialsMarkupRevised: "9.00",
                    resourcesMarkupActual: "6.00",
                    resourcesMarkupEstimate: "5.00",
                    resourcesMarkupRevised: "7.00",
                    // ADJUSTED TOTALS
                    adjustedActual: "550.00",
                    adjustedEstimate: "520.00",
                    adjustedRevised: "580.00",
                    // DISCOUNTS
                    membershipDiscount: "0.00",
                    discount: "10.00",
                    // STC / VEEC
                    stcs: "0.00",
                    veecs: "0.00",
                    // PROFITS
                    grossProfitActual: "100.00",
                    grossProfitEstimate: "90.00",
                    grossProfitRevised: "120.00",
                    grossMarginActual: "18.00",
                    grossMarginEstimate: "16.00",
                    grossMarginRevised: "20.00",
                    nettProfitActual: "60.00",
                    nettProfitEstimate: "55.00",
                    nettProfitRevised: "70.00",
                    nettMarginActual: "12.00",
                    nettMarginEstimate: "11.00",
                    nettMarginRevised: "13.00",
                    // INVOICING
                    invoicedValue: "250.00",
                    invoicePercentage: "50.00",
                    // OTHER
                    percentComplete: 30,
                    dateModified: new Date(),
                    lastSynced: new Date(),
                },
            });
        }
    }
    console.log("✅ Seed 5 — Job Cost Centers created (5 per job)");
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
