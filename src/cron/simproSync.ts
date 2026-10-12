import cron from "node-cron";
import { syncJobs } from "../services/jobs.service";
import { syncQuotes } from "../services/quote.service";
import { syncJobCostCenters } from "../services/jobCostCenter.service";
import { syncContractorJobs } from "../services/contractorJob.service";
import { syncCustomers } from "../services/customer.service";
import { syncSites } from "../services/site.service";
import { syncEmployees } from "../services/employee.service";

const companyId = "cmtsizk0m0000chocs3fxgzgv";
const simproCompanyId = "0";

const retrySync = async (
  name: string,
  syncFunction: () => Promise<unknown>,
  retries = 3,
  delayMs = 10000,
) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await syncFunction();

      console.log(`✅ ${name} synced`);
      return;
    } catch (error) {
      console.error(
        `❌ ${name} failed (attempt ${attempt}/${retries}):`,
        error,
      );

      if (attempt === retries) {
        console.error(`🚨 ${name} failed after ${retries} attempts`);
        return;
      }

      console.log(`🔁 Retrying ${name} in ${delayMs / 1000}s...`);

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

export const runSimproSync = async () => {
  console.log("========================================");
  console.log("🔄 Starting Simpro sync");
  console.log("========================================");

  try {
    if (!companyId || !simproCompanyId) {
      throw new Error("SIMPRO_COMPANY_ID is not configured");
    }

    await retrySync("Customers", () =>
      syncCustomers(companyId, simproCompanyId, true),
    );

    await retrySync("Sites", () => syncSites(companyId, simproCompanyId, true));

    await retrySync("Employees", () =>
      syncEmployees(companyId, simproCompanyId, true),
    );

    await retrySync("Jobs", () => syncJobs(companyId, simproCompanyId, true));

    await retrySync("Quotes", () =>
      syncQuotes(companyId, simproCompanyId, true),
    );

    await retrySync("Job cost centres", () =>
      syncJobCostCenters(companyId, simproCompanyId),
    );

    await retrySync("Contractor jobs", () =>
      syncContractorJobs(companyId, simproCompanyId),
    );

    console.log("========================================");
    console.log("✅ Simpro sync completed");
    console.log("========================================");
  } catch (error) {
    console.error("❌ Simpro sync failed:", error);
  }
};

cron.schedule(
  "0 6,14 * * *",
  () => {
    console.log("⏰ Scheduled Simpro sync triggered");
    runSimproSync();
  },
  {
    timezone: "Europe/London",
  },
);

// // Run immediately on startup
// console.log("⏰ Running initial Simpro sync...");
// runSimproSync();
