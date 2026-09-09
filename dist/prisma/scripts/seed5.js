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
    if (!customers.length)
        throw new Error("❌ No customers found.");
    if (!sites.length)
        throw new Error("❌ No sites found.");
    if (!employees.length)
        throw new Error("❌ No employees found.");
    // clear existing
    await prisma.quote.deleteMany({});
    console.log("🧹 Cleared Quotes");
    let idCounter = 5001;
    const quoteTemplates = [
        {
            name: "Fire Alarm Installation",
            type: "Installation",
            statusName: "Pending",
        },
        { name: "AC Repair Quote", type: "Service", statusName: "Sent" },
        { name: "CCTV Upgrade Proposal", type: "Project", statusName: "Accepted" },
        {
            name: "Boiler Maintenance Quote",
            type: "Maintenance",
            statusName: "Approved",
        },
        {
            name: "Lighting Replacement Quote",
            type: "Electrical",
            statusName: "Draft",
        },
    ];
    for (const q of quoteTemplates) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const customerSites = sites.filter((s) => s.customerId === customer.id);
        const site = customerSites.length ? customerSites[0] : sites[0];
        const tech = employees[Math.floor(Math.random() * employees.length)];
        const pm = employees[Math.floor(Math.random() * employees.length)];
        const sp = employees[Math.floor(Math.random() * employees.length)];
        await prisma.quote.create({
            data: {
                id: idCounter++,
                companyId: company.id,
                // CORE INFO
                reference: `QT-${idCounter}`,
                name: q.name,
                description: `${q.name} for ${customer.companyName}`,
                notes: "Seeded quote",
                type: q.type,
                // CUSTOMER
                customerId: customer.id,
                customerName: customer.companyName,
                customerGivenName: "John",
                customerFamilyName: "Doe",
                // CUSTOMER CONTACT
                customerContactId: 100,
                customerContactGivenName: "Sarah",
                customerContactFamilyName: "Smith",
                // SITE
                siteId: site.id,
                siteName: site.name,
                // SITE CONTACT
                siteContactId: 200,
                siteContactGivenName: "Mike",
                siteContactFamilyName: "Brown",
                // CONVERTED FROM LEAD
                convertedFromLeadId: 10,
                convertedFromLeadName: "Website Inquiry",
                convertedFromLeadDateCreated: new Date("2023-06-01"),
                // SALESPEOPLE / MANAGERS
                salespersonId: sp.id,
                salespersonName: sp.name,
                salespersonType: "Employee",
                salespersonTypeId: 1,
                projectManagerId: pm.id,
                projectManagerName: pm.name,
                projectManagerType: "Employee",
                projectManagerTypeId: 2,
                technicianId: tech.id,
                technicianName: tech.name,
                technicianType: "Employee",
                technicianTypeId: 3,
                // DATES
                dateIssued: new Date(),
                dateApproved: new Date(Date.now() + 2 * 86400000),
                dueDate: new Date(Date.now() + 5 * 86400000),
                dateCreated: new Date(),
                dateSent: new Date(Date.now() + 1 * 86400000),
                dateAccepted: new Date(Date.now() + 4 * 86400000),
                dateExpires: new Date(Date.now() + 14 * 86400000),
                dateModified: new Date(),
                validityDays: 30,
                // ORDER / REQUEST
                orderNo: `ORD-${idCounter}`,
                requestNo: `REQ-${idCounter}`,
                // STATUS
                statusId: 1,
                statusName: q.statusName,
                statusColor: "#00AAFF",
                stage: "Initial",
                customerStage: "Review",
                // VARIATION INFO
                isClosed: false,
                isVariation: false,
                archiveReasonId: 0,
                archiveReasonName: null,
                linkedJobId: null,
                jobNo: null,
                // FORECAST
                forecastYear: 2025,
                forecastMonth: 6,
                forecastPercent: "50.00",
                // TOTALS
                totalExTax: "1200.00",
                totalTax: "240.00",
                totalIncTax: "1440.00",
                // MATERIALS
                materialsCostEstimate: "600.00",
                materialsCostRevised: "650.00",
                materialsMarkupEstimate: "15.00",
                materialsMarkupRevised: "18.00",
                // LABOR
                laborEstimate: "400.00",
                laborRevised: "450.00",
                laborHoursEstimate: "12.00",
                laborHoursRevised: "14.00",
                // PLANT
                plantEstimate: "150.00",
                plantRevised: "160.00",
                plantHoursEstimate: "4.00",
                plantHoursRevised: "4.50",
                // COMMISSION / OVERHEAD
                commissionEstimate: "0.00",
                commissionRevised: "0.00",
                overheadEstimate: "80.00",
                overheadRevised: "90.00",
                // RESOURCES COST
                resourcesCostEstimate: "300.00",
                resourcesCostRevised: "320.00",
                resourcesMarkupEstimate: "10.00",
                resourcesMarkupRevised: "12.00",
                // ADJUSTED TOTALS
                adjustedEstimate: "1500.00",
                adjustedRevised: "1600.00",
                // DISCOUNTS
                membershipDiscount: "0.00",
                discount: "50.00",
                // STC / VEEC
                stcsEligible: false,
                veecsEligible: false,
                stcValue: "0.00",
                veecValue: "0.00",
                // RELATION: converting to job later
                convertedToJob: false,
                jobId: null,
                // META
                lastSynced: new Date(),
            },
        });
    }
    console.log("✅ Seed 4 — Quotes created successfully");
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
