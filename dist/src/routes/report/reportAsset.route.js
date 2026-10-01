"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportAssetsRoutes = void 0;
const express_1 = require("express");
const reportAssets_controller_1 = require("../../controllers/report/reportAssets.controller");
exports.reportAssetsRoutes = (0, express_1.Router)();
exports.reportAssetsRoutes.post("/sync", reportAssets_controller_1.reportAssetsController.syncAssets);
