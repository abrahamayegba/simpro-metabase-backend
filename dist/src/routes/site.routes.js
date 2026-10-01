"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.siteSyncRoutes = void 0;
const express_1 = require("express");
const site_controller_1 = require("../controllers/site.controller");
exports.siteSyncRoutes = (0, express_1.Router)();
// No archived customers
exports.siteSyncRoutes.post("/sync", site_controller_1.siteSyncController.syncActiveSites);
// User decides whether archived customers are included
exports.siteSyncRoutes.post("/sync/all", site_controller_1.siteSyncController.syncSites);
