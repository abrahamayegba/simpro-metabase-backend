"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportContractorInvoicesRoutes = void 0;
const express_1 = require("express");
const reportContractorInvoices_controller_1 = require("../../controllers/report/reportContractorInvoices.controller");
exports.reportContractorInvoicesRoutes = (0, express_1.Router)();
exports.reportContractorInvoicesRoutes.post("/sync", reportContractorInvoices_controller_1.reportContractorInvoicesController.syncContractorInvoices);
