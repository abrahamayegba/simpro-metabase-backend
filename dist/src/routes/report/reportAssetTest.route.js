"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportAssetTestsRoutes = void 0;
const express_1 = require("express");
const reportAssetTests_controller_1 = require("../../controllers/report/reportAssetTests.controller");
exports.reportAssetTestsRoutes = (0, express_1.Router)();
// Import asset test CSV snapshot
exports.reportAssetTestsRoutes.post("/import", reportAssetTests_controller_1.reportAssetTestsController.importAssetTests);
