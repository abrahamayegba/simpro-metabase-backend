"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportInvoiceJobsRoutes = void 0;
const express_1 = require("express");
const reportInvoiceJobs_controller_1 = require("../../controllers/report/reportInvoiceJobs.controller");
exports.reportInvoiceJobsRoutes = (0, express_1.Router)();
exports.reportInvoiceJobsRoutes.post("/sync", reportInvoiceJobs_controller_1.reportInvoiceJobsController.syncInvoiceJobs);
