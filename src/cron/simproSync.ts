import cron from "node-cron";
import { syncCustomers } from "../services/customer.service";
import { syncSites } from "../services/site.service";
import { syncEmployees } from "../services/employee.service";
import { syncJobs } from "../services/jobs.service";
import { syncQuotes } from "../services/quote.service";
import { syncJobCostCenters } from "../services/jobCostCenter.service";
import { syncContractorJobs } from "../services/contractorJob.service";

const companyId = "cmtsizk0m0000chocs3fxgzgv";
const simproCompanyId = "0";

export const runSimproSync = async () => {
  console.log("========================================");
  console.log("🔄 Starting Simpro sync");
  console.log("========================================");

  try {
    if (!companyId || !simproCompanyId) {
      throw new Error("SIMPRO_COMPANY_ID is not configured");
    }

    console.log("👥 Syncing customers...");
    await syncCustomers(companyId, simproCompanyId, true);
    console.log("✅ Customers synced");

    console.log("🏢 Syncing sites...");
    await syncSites(companyId, simproCompanyId, true);
    console.log("✅ Sites synced");

    console.log("👷 Syncing employees...");
    await syncEmployees(companyId, simproCompanyId, true);
    console.log("✅ Employees synced");

    console.log("🔧 Syncing jobs...");
    await syncJobs(companyId, simproCompanyId, true);
    console.log("✅ Jobs synced");

    console.log("📋 Syncing quotes...");
    await syncQuotes(companyId, simproCompanyId, true);
    console.log("✅ Quotes synced");

    console.log("💰 Syncing job cost centres...");
    await syncJobCostCenters(companyId, simproCompanyId);
    console.log("✅ Job cost centres synced");

    console.log("👷‍♂️ Syncing contractor jobs...");
    await syncContractorJobs(companyId, simproCompanyId);
    console.log("✅ Contractor jobs synced");

    console.log("========================================");
    console.log("✅ Simpro sync completed");
    console.log("========================================");
  } catch (error) {
    console.error("❌ Simpro sync failed:", error);
  }
};

setTimeout(
  () => {
    console.log("⏰ 2-minute test timer triggered");
    runSimproSync();
  },
  2 * 60 * 1000,
);