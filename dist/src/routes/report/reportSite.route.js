"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportSitesRoutes = void 0;
const express_1 = require("express");
const reportSites_controller_1 = require("../../controllers/report/reportSites.controller");
exports.reportSitesRoutes = (0, express_1.Router)();
exports.reportSitesRoutes.post("/sync", reportSites_controller_1.reportSitesController.syncSites);
