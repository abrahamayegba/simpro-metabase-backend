"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractorJobSyncRoutes = void 0;
const express_1 = require("express");
const contractorJob_controller_1 = require("../controllers/contractorJob.controller");
exports.contractorJobSyncRoutes = (0, express_1.Router)();
// No archived customers
exports.contractorJobSyncRoutes.post("/sync", contractorJob_controller_1.contractorJobSyncController.syncContractorJobs);
