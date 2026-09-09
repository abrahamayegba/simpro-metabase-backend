"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("⏳ Loading Ignite Consultancy data...");
    const company = await prisma.company.findFirst({
        where: { name: "Ignite Consultancy" },
    });
    if (!company)
        throw new Error("Ignite Consultancy not found");
    const customers = await prisma.customer.findMany({
        where: { companyId: company.id },
    });
    const sites = await prisma.site.findMany({
        where: { companyId: company.id },
    });
    const employees = await prisma.employee.findMany({
        where: { companyId: company.id },
    });
    if (customers.length === 0)
        throw new Error("❌ No customers found. Run the customer seed first.");
    if (sites.length === 0)
        throw new Error("❌ No sites found. Customer seed did not generate sites.");
    if (employees.length === 0)
        throw new Error("❌ No employees found. Run the employee seed first.");
    // correct deletion order
    await prisma.contractorJob.deleteMany({});
    await prisma.jobCostCenter.deleteMany({});
    await prisma.job.deleteMany({});
    console.log("🧹 Cleared Jobs & related tables");
    let idCounter = 4001;
    const jobs = [
        {
            name: "Fire Alarm Panel Upgrade",
            type: "Project",
            priority: "High",
            statusName: "In Progress",
        },
        {
            name: "Emergency Lighting Test",
            type: "Maintenance",
            priority: "Medium",
            statusName: "Scheduled",
        },
        {
            name: "AC Unit Service",
            type: "Service",
            priority: "Low",
            statusName: "Completed",
        },
        {
            name: "CCTV Installation",
            type: "Installation",
            priority: "High",
            statusName: "Quoted",
        },
        {
            name: "Boiler Annual Check",
            type: "Maintenance",
            priority: "Medium",
            statusName: "In Progress",
        },
    ];
    for (const j of jobs) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const customerSites = sites.filter((s) => s.customerId === customer.id);
        const site = customerSites.length ? customerSites[0] : sites[0];
        if (!site)
            throw new Error("❌ No valid site found after filtering.");
        const tech = employees[Math.floor(Math.random() * employees.length)];
        await prisma.job.create({
            data: {
                id: idCounter++,
                companyId: company.id,
                archived: false,
                // BASIC INFO
                type: j.type,
                reference: `REF-${idCounter}`,
                orderNo: `ORD-${idCounter}`,
                requestNo: `REQ-${idCounter}`,
                name: j.name,
                description: `${j.name} at ${site.name}`,
                notes: "Example job seeded",
                // CUSTOMER
                customerId: customer.id,
                customerName: customer.companyName,
                customerGivenName: "John",
                customerFamilyName: "Doe",
                // CUSTOMER CONTRACT
                customerContractId: 101,
                customerContractName: "Standard Contract",
                customerContractStartDate: new Date("2022-01-01"),
                customerContractEndDate: new Date("2025-01-01"),
                customerContractNo: "CON-001",
                // CUSTOMER CONTACT
                customerContactId: 501,
                customerContactGivenName: "Sarah",
                customerContactFamilyName: "Smith",
                // SITE
                siteId: site.id,
                siteName: site.name,
                // SITE CONTACT
                siteContactId: 601,
                siteContactGivenName: "Michael",
                siteContactFamilyName: "Brown",
                // DATE FIELDS
                dateIssued: new Date(),
                dueDate: new Date(Date.now() + 7 * 86400000),
                dueTime: "14:00",
                dateCreated: new Date(),
                dateScheduled: new Date(Date.now() + 3 * 86400000),
                dateCompleted: null,
                dateInvoiced: null,
                dateModified: new Date(),
                // TAGS (JSON)
                tags: ["urgent", "seed"],
                // SALESPERSON
                salespersonId: 701,
                salespersonName: "Alex Johnson",
                salespersonType: "Internal",
                salespersonTypeId: 10,
                // PROJECT MANAGER
                projectManagerId: tech.id,
                projectManagerName: tech.name,
                projectManagerType: "Employee",
                projectManagerTypeId: 200,
                // MAIN TECHNICIAN
                technicianId: tech.id,
                technicianName: tech.name,
                technicianType: "Employee",
                technicianTypeId: 300,
                // TECHNICIANS ARRAY
                technicians: [{ id: tech.id, name: tech.name }],
                // STATUS
                statusId: idCounter,
                statusName: j.statusName,
                statusColor: "#00AAFF",
                stage: "Active",
                jobType: j.type,
                priority: j.priority,
                // RESPONSE TIME
                responseTimeId: 5,
                responseTimeName: "Standard Response",
                responseTimeDays: 2,
                responseTimeHours: 5,
                responseTimeMinutes: 30,
                // VARIATIONS
                isVariation: false,
                // QUOTE ORIGIN
                convertedFromQuoteId: null,
                convertedFromQuoteDescription: null,
                convertedFromQuoteExTax: "0.00",
                convertedFromQuoteTax: "0.00",
                convertedFromQuoteIncTax: "0.00",
                // GENERIC ORIGIN
                convertedFromId: null,
                convertedFromType: null,
                convertedFromDate: null,
                // TOTALS
                totalExTax: "500.00",
                totalTax: "100.00",
                totalIncTax: "600.00",
                // MATERIAL COSTS
                materialsCostActual: "200.00",
                materialsCostCommitted: "50.00",
                materialsCostEstimate: "180.00",
                materialsCostRevised: "220.00",
                // RESOURCE COSTS
                resourcesCostActual: "150.00",
                resourcesCostCommitted: "20.00",
                resourcesCostEstimate: "130.00",
                resourcesCostRevised: "170.00",
                // LABOR COST
                laborActual: "100.00",
                laborCommitted: "10.00",
                laborEstimate: "90.00",
                laborRevised: "120.00",
                // LABOR HOURS
                laborHoursActual: "8.00",
                laborHoursCommitted: "1.00",
                laborHoursEstimate: "6.00",
                laborHoursRevised: "9.00",
                // PLANT
                plantActual: "50.00",
                plantCommitted: "0.00",
                plantEstimate: "40.00",
                plantRevised: "60.00",
                plantHoursActual: "2.00",
                plantHoursEstimate: "1.50",
                plantHoursRevised: "2.50",
                // COMMISSION
                commissionActual: "0.00",
                commissionEstimate: "0.00",
                commissionRevised: "0.00",
                // OVERHEAD
                overheadActual: "30.00",
                overheadCommitted: "5.00",
                overheadEstimate: "25.00",
                overheadRevised: "35.00",
                // MARKUPS
                materialsMarkupActual: "10.00",
                materialsMarkupEstimate: "9.00",
                materialsMarkupRevised: "11.00",
                resourcesMarkupActual: "8.00",
                resourcesMarkupEstimate: "7.00",
                resourcesMarkupRevised: "9.00",
                // ADJUSTED TOTALS
                adjustedActual: "550.00",
                adjustedEstimate: "530.00",
                adjustedRevised: "580.00",
                // DISCOUNTS
                membershipDiscount: "0.00",
                discount: "20.00",
                // STC/VEEC
                stcsEligible: false,
                veecsEligible: false,
                stcValue: "0.00",
                veecValue: "0.00",
                // PROFITS
                grossProfitActual: "120.00",
                grossProfitEstimate: "110.00",
                grossProfitRevised: "140.00",
                grossMarginActual: "20.00",
                grossMarginEstimate: "18.00",
                grossMarginRevised: "22.00",
                nettProfitActual: "80.00",
                nettProfitEstimate: "70.00",
                nettProfitRevised: "90.00",
                nettMarginActual: "15.00",
                nettMarginEstimate: "14.00",
                nettMarginRevised: "16.00",
                // INVOICING
                invoicedValue: "300.00",
                invoicePercentage: "60.00",
                // FLAGS
                autoAdjustStatus: false,
                isRetentionEnabled: false,
                // META
                lastSynced: new Date(),
                // RELATIONS
                assignedEmployees: {
                    connect: [{ id: tech.id }],
                },
            },
        });
    }
    console.log("✅ Seed 3 — Jobs created successfully");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
