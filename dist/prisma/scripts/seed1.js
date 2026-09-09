"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // DELETE IN THE RIGHT ORDER
    await prisma.site.deleteMany({});
    await prisma.customer.deleteMany({});
    const companyId = "cmk2sk5am0001chwc3uz17gtq";
    const sampleCustomers = [
        "Apex Facilities Group",
        "Northern Heating Solutions",
        "Glasgow Property Services",
        "BlueSky Electrical",
        "UrbanTech Maintenance",
        "Prime Fire Safety",
        "EnviroClean FM",
        "Highland Mechanical",
        "Metro Security Services",
        "Strathclyde Engineering",
        "BrightBuild Contractors",
        "SafeGuard Compliance",
        "EcoTech Installations",
        "Fusion Maintenance",
        "Caledonia Facilities",
        "Rapid Response Engineers",
        "GreenWave Energy",
        "Titan Property Care",
        "Northshore Commercial Services",
        "Precision HVAC",
    ];
    let idCounter = 1001;
    for (const name of sampleCustomers) {
        const customerId = idCounter++;
        await prisma.customer.create({
            data: {
                id: customerId,
                companyId,
                companyName: name,
                phone: "0141 555 0000",
                doNotCall: false,
                altPhone: "0141 555 9999",
                email: name.toLowerCase().replace(/ /g, "") + "@example.com",
                website: "https://example.com",
                fax: "0141 000 1111",
                ein: "GB123456789",
                companyNumber: "SC" + Math.floor(Math.random() * 900000),
                address: `${Math.floor(Math.random() * 80) + 10} Bath Street`,
                city: "Glasgow",
                state: "Scotland",
                postalCode: "G2 1HB",
                country: "UK",
                billingAddress: "123 Billing Road",
                billingCity: "Glasgow",
                billingState: "Scotland",
                billingPostalCode: "G3 1AA",
                billingCountry: "UK",
                customerType: "Commercial",
                amountOwing: "1200.50",
                creditLimit: "5000",
                onStop: false,
                archived: false,
                tags: ["VIP", "Priority"],
                preferredTechs: ["John Smith", "Jane Doe"],
                partTaxCodeId: 200,
                partTaxCodeCode: "PTC20",
                partTaxCodeType: "Standard",
                partTaxCodeRate: "20.00",
                partReverseTaxEnabled: false,
                labourTaxCodeId: 300,
                labourTaxCodeCode: "LTC05",
                labourTaxCodeType: "Reduced",
                labourTaxCodeRate: "5.00",
                labourReverseTaxEnabled: false,
                discountFee: "15.00",
                alwaysDeductCIS: false,
                serviceFeeId: 10,
                serviceFeeName: "Standard Service Fee",
                materialPricingTierId: 2,
                materialPricingTierName: "Tier 2",
                materialPricingTierMarkup: "10.00",
                materialMarkup: "5.00",
                profileNotes: "Important long-term client.",
                customerProfileId: 1,
                customerProfileName: "Default Profile",
                customerGroupId: 3,
                customerGroupName: "Group A",
                accountManagerId: 90,
                accountManagerName: "Alex Johnson",
                currency: "GBP",
                serviceJobCostCenterId: 7,
                serviceJobCostCenterName: "Maintenance",
                bankAccountName: name + " Ltd",
                bankRoutingNo: "12-34-56",
                bankAccountNo: "98765432",
                paymentMethodId: 1,
                paymentMethodName: "Bank Transfer",
                paymentTermId: 30,
                paymentTermDays: 30,
                paymentTermType: "Net",
                retentionType: "Standard",
                vendorOrderNoRequired: false,
                dateCreated: new Date(),
                dateModified: new Date(),
                lastSynced: new Date(),
            },
        });
    }
    console.log("✅ Customer seed complete.");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => prisma.$disconnect());
