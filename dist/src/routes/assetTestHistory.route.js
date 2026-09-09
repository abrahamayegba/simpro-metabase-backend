"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetTestHistorySyncRoutes = void 0;
const express_1 = require("express");
const assetTestHistory_controller_1 = require("../controllers/assetTestHistory.controller");
exports.assetTestHistorySyncRoutes = (0, express_1.Router)();
exports.assetTestHistorySyncRoutes.post("/sync", assetTestHistory_controller_1.assetTestHistorySyncController.syncAssetTestHistory);
