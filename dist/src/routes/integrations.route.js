"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationRoutes = void 0;
const express_1 = require("express");
const integration_controller_1 = require("../controllers/integration.controller");
exports.integrationRoutes = (0, express_1.Router)();
// Create / upsert integration
exports.integrationRoutes.post("/", integration_controller_1.integrationController.createIntegration);
// Get all integrations
exports.integrationRoutes.get("/", integration_controller_1.integrationController.getIntegrations);
// Get integrations by company
exports.integrationRoutes.get("/company/:companyId", integration_controller_1.integrationController.getIntegrationsByCompanyId);
// Get integrations by userId
exports.integrationRoutes.get("/user/:userId", integration_controller_1.integrationController.getIntegrationsByUserId);
// Update integration
exports.integrationRoutes.put("/:id", integration_controller_1.integrationController.updateIntegration);
// Delete integration
exports.integrationRoutes.delete("/:id", integration_controller_1.integrationController.deleteIntegration);
