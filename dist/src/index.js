"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const roles_route_1 = require("./routes/roles.route");
const users_route_1 = require("./routes/users.route");
const auth_routes_1 = require("./routes/auth.routes");
const companies_route_1 = require("./routes/companies.route");
const integrations_route_1 = require("./routes/integrations.route");
const job_routes_1 = require("./routes/job.routes");
const customer_routes_1 = require("./routes/customer.routes");
const site_routes_1 = require("./routes/site.routes");
const employee_routes_1 = require("./routes/employee.routes");
const quotes_routes_1 = require("./routes/quotes.routes");
const jobCostCenter_route_1 = require("./routes/jobCostCenter.route");
const customerAssets_route_1 = require("./routes/customerAssets.route");
const contractorJob_route_1 = require("./routes/contractorJob.route");
const assetTestHistory_route_1 = require("./routes/assetTestHistory.route");
const reportCustomer_route_1 = require("./routes/report/reportCustomer.route");
const reportSite_route_1 = require("./routes/report/reportSite.route");
const reportEmployee_route_1 = require("./routes/report/reportEmployee.route");
const reportQuote_route_1 = require("./routes/report/reportQuote.route");
const reportJob_route_1 = require("./routes/report/reportJob.route");
const reportAsset_route_1 = require("./routes/report/reportAsset.route");
const reportAssetServiceLevel_route_1 = require("./routes/report/reportAssetServiceLevel.route");
const reportContractorJobs_route_1 = require("./routes/report/reportContractorJobs.route");
const reportInvoiceJob_route_1 = require("./routes/report/reportInvoiceJob.route");
const reportInvoices_route_1 = require("./routes/report/reportInvoices.route");
const reportJobCostCentre_route_1 = require("./routes/report/reportJobCostCentre.route");
const reportResponseTimes_route_1 = require("./routes/report/reportResponseTimes.route");
const reportSchedule_route_1 = require("./routes/report/reportSchedule.route");
const reportContractorInvoice_route_1 = require("./routes/report/reportContractorInvoice.route");
const reportAssetTest_route_1 = require("./routes/report/reportAssetTest.route");
const reportJobResponseTime_route_1 = require("./routes/report/reportJobResponseTime.route");
const syncEntityConfig_route_1 = __importDefault(require("./routes/syncEntityConfig.route"));
const sync_route_1 = __importDefault(require("./routes/sync.route"));
dotenv_1.default.config();
const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];
// ✅ Dynamic CORS handling
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // allow request
        }
        else {
            console.log("❌ Blocked by CORS:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};
const app = (0, express_1.default)();
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/", (_, res) => {
    res.status(200).json({ message: "Api is healthy ..." });
});
// routes
app.use("/api/v1/auth", auth_routes_1.authRoutes);
app.use("/api/v1/users", users_route_1.userRoutes);
app.use("/api/v1/companies", companies_route_1.companyRoutes);
app.use("/api/v1/roles", roles_route_1.roleRoutes);
app.use("/api/v1/integrations", integrations_route_1.integrationRoutes);
app.use("/api/v1/jobs", job_routes_1.jobSyncRoutes);
app.use("/api/v1/customers", customer_routes_1.customerSyncRoutes);
app.use("/api/v1/sites", site_routes_1.siteSyncRoutes);
app.use("/api/v1/employees", employee_routes_1.employeeSyncRoutes);
app.use("/api/v1/quotes", quotes_routes_1.quoteSyncRoutes);
app.use("/api/v1/jobCostCenters", jobCostCenter_route_1.jobCostCenterSyncRoutes);
app.use("/api/v1/customerAssets", customerAssets_route_1.customerAssetsSyncRoutes);
app.use("/api/v1/contractorJobs", contractorJob_route_1.contractorJobSyncRoutes);
app.use("/api/v1/assetTestHistory", assetTestHistory_route_1.assetTestHistorySyncRoutes);
// =========================================
// SYNC ENTITY CONFIG ROUTES
// =========================================
app.use("/api/v1/syncEntityConfig", syncEntityConfig_route_1.default);
app.use("/api/v1/sync", sync_route_1.default);
// =========================================
// REPORT SYNC ROUTES
// =========================================
app.use("/api/v1/report/customers", reportCustomer_route_1.reportCustomersRoutes);
app.use("/api/v1/report/sites", reportSite_route_1.reportSitesRoutes);
app.use("/api/v1/report/employees", reportEmployee_route_1.reportEmployeesRoutes);
app.use("/api/v1/report/jobs", reportJob_route_1.reportJobsRoutes);
app.use("/api/v1/report/quotes", reportQuote_route_1.reportQuotesRoutes);
app.use("/api/v1/report/assets", reportAsset_route_1.reportAssetsRoutes);
app.use("/api/v1/report/assetServiceLevels", reportAssetServiceLevel_route_1.reportAssetServiceLevelsRoutes);
app.use("/api/v1/report/contractorJobs", reportContractorJobs_route_1.reportContractorJobsRoutes);
app.use("/api/v1/report/invoiceJobs", reportInvoiceJob_route_1.reportInvoiceJobsRoutes);
app.use("/api/v1/report/invoices", reportInvoices_route_1.reportInvoicesRoutes);
app.use("/api/v1/report/jobCostCentres", reportJobCostCentre_route_1.reportJobCostCentresRoutes);
app.use("/api/v1/report/responseTimes", reportResponseTimes_route_1.reportResponseTimesRoutes);
app.use("/api/v1/report/schedules", reportSchedule_route_1.reportSchedulesRoutes);
app.use("/api/v1/report/contractorInvoices", reportContractorInvoice_route_1.reportContractorInvoicesRoutes);
app.use("/api/v1/report/assetTests", reportAssetTest_route_1.reportAssetTestsRoutes);
app.use("/api/v1/report/jobResponseTimes", reportJobResponseTime_route_1.reportJobResponseTimesRoutes);
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`✅ App running on http://localhost:${port}`);
});
