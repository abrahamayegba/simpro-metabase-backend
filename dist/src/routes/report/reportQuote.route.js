"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportQuotesRoutes = void 0;
const express_1 = require("express");
const reportQuotes_controller_1 = require("../../controllers/report/reportQuotes.controller");
exports.reportQuotesRoutes = (0, express_1.Router)();
exports.reportQuotesRoutes.post("/sync", reportQuotes_controller_1.reportQuotesController.syncQuotes);
