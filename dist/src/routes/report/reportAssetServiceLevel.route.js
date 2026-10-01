"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportAssetServiceLevelsRoutes = void 0;
const express_1 = require("express");
const reportAssetServiceLevels_controller_1 = require("../../controllers/report/reportAssetServiceLevels.controller");
exports.reportAssetServiceLevelsRoutes = (0, express_1.Router)();
exports.reportAssetServiceLevelsRoutes.post("/sync", reportAssetServiceLevels_controller_1.reportAssetServiceLevelsController.syncAssetServiceLevels);
