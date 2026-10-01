"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerAssetsSyncRoutes = void 0;
const express_1 = require("express");
const customerAssets_controller_1 = require("../controllers/customerAssets.controller");
exports.customerAssetsSyncRoutes = (0, express_1.Router)();
// No archived jobs
exports.customerAssetsSyncRoutes.post("/sync", customerAssets_controller_1.customerAssetController.syncCustomerAssets);
