"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const companyId = "cmtsizk0m0000chocs3fxgzgv";
    await prisma.integration.update({
        where: {
            companyId_provider: {
                companyId,
                provider: "simpro",
            },
        },
        data: {
            apiUrl: "https://virtualfacilityservices.simprosuite.com",
        },
    });
    console.log("✅ Simpro integration updated");
}
main()
    .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
