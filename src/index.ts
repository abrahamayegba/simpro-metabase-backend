import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { roleRoutes } from "./routes/roles.route";
import { userRoutes } from "./routes/users.route";

import { authRoutes } from "./routes/auth.routes";
import { companyRoutes } from "./routes/companies.route";
import { integrationRoutes } from "./routes/integrations.route";
import { jobSyncRoutes } from "./routes/job.routes";
import { customerSyncRoutes } from "./routes/customer.routes";
import { siteSyncRoutes } from "./routes/site.routes";
import { employeeSyncRoutes } from "./routes/employee.routes";
import { quoteSyncRoutes } from "./routes/quotes.routes";
import { jobCostCenterSyncRoutes } from "./routes/jobCostCenter.route";
import { customerAssetsSyncRoutes } from "./routes/customerAssets.route";
import { contractorJobSyncRoutes } from "./routes/contractorJob.route";
import { assetTestHistorySyncRoutes } from "./routes/assetTestHistory.route";
import { reportCustomersRoutes } from "./routes/report/reportCustomer.route";
import { reportSitesRoutes } from "./routes/report/reportSite.route";
import { reportEmployeesRoutes } from "./routes/report/reportEmployee.route";
import { reportQuotesRoutes } from "./routes/report/reportQuote.route";
import { reportJobsRoutes } from "./routes/report/reportJob.route";
import { reportAssetsRoutes } from "./routes/report/reportAsset.route";
import { reportAssetServiceLevelsRoutes } from "./routes/report/reportAssetServiceLevel.route";
import { reportContractorJobsRoutes } from "./routes/report/reportContractorJobs.route";
import { reportInvoiceJobsRoutes } from "./routes/report/reportInvoiceJob.route";
import { reportInvoicesRoutes } from "./routes/report/reportInvoices.route";
import { reportJobCostCentresRoutes } from "./routes/report/reportJobCostCentre.route";
import { reportResponseTimesRoutes } from "./routes/report/reportResponseTimes.route";
import { reportSchedulesRoutes } from "./routes/report/reportSchedule.route";
import { reportContractorInvoicesRoutes } from "./routes/report/reportContractorInvoice.route";
import { reportAssetTestsRoutes } from "./routes/report/reportAssetTest.route";
import { reportJobResponseTimesRoutes } from "./routes/report/reportJobResponseTime.route";
import SyncEntityConfigRouter from "./routes/syncEntityConfig.route";
import getDashboardRouter from "./routes/sync.route";

dotenv.config();

const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

// ✅ Dynamic CORS handling
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // allow request
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) => {
  res.status(200).json({ message: "Api is healthy ..." });
});

// routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/companies", companyRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/integrations", integrationRoutes);
app.use("/api/v1/jobs", jobSyncRoutes);
app.use("/api/v1/customers", customerSyncRoutes);
app.use("/api/v1/sites", siteSyncRoutes);
app.use("/api/v1/employees", employeeSyncRoutes);
app.use("/api/v1/quotes", quoteSyncRoutes);
app.use("/api/v1/jobCostCenters", jobCostCenterSyncRoutes);
app.use("/api/v1/customerAssets", customerAssetsSyncRoutes);
app.use("/api/v1/contractorJobs", contractorJobSyncRoutes);
app.use("/api/v1/assetTestHistory", assetTestHistorySyncRoutes);

// =========================================
// SYNC ENTITY CONFIG ROUTES
// =========================================

app.use("/api/v1/syncEntityConfig", SyncEntityConfigRouter);
app.use("/api/v1/sync", getDashboardRouter);

// =========================================
// REPORT SYNC ROUTES
// =========================================

app.use("/api/v1/report/customers", reportCustomersRoutes);
app.use("/api/v1/report/sites", reportSitesRoutes);
app.use("/api/v1/report/employees", reportEmployeesRoutes);
app.use("/api/v1/report/jobs", reportJobsRoutes);
app.use("/api/v1/report/quotes", reportQuotesRoutes);
app.use("/api/v1/report/assets", reportAssetsRoutes);
app.use("/api/v1/report/assetServiceLevels", reportAssetServiceLevelsRoutes);
app.use("/api/v1/report/contractorJobs", reportContractorJobsRoutes);
app.use("/api/v1/report/invoiceJobs", reportInvoiceJobsRoutes);
app.use("/api/v1/report/invoices", reportInvoicesRoutes);
app.use("/api/v1/report/jobCostCentres", reportJobCostCentresRoutes);
app.use("/api/v1/report/responseTimes", reportResponseTimesRoutes);
app.use("/api/v1/report/schedules", reportSchedulesRoutes);
app.use("/api/v1/report/contractorInvoices", reportContractorInvoicesRoutes);
app.use("/api/v1/report/assetTests", reportAssetTestsRoutes);

app.use("/api/v1/report/jobResponseTimes", reportJobResponseTimesRoutes);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`✅ App running on http://localhost:${port}`);
});
