"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobSyncRoutes = void 0;
const express_1 = require("express");
const job_controller_1 = require("../controllers/job.controller");
exports.jobSyncRoutes = (0, express_1.Router)();
// No archived jobs
exports.jobSyncRoutes.post("/sync", job_controller_1.jobSyncController.syncActiveJobs);
// User decides whether archived jobs are included
exports.jobSyncRoutes.post("/sync/all", job_controller_1.jobSyncController.syncJobs);
