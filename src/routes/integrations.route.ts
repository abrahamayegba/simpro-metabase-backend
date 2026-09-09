import { Router } from "express";
import { integrationController } from "../controllers/integration.controller";

export const integrationRoutes = Router();

// Create / upsert integration
integrationRoutes.post("/", integrationController.createIntegration);

// Get all integrations
integrationRoutes.get("/", integrationController.getIntegrations);

// Get integrations by company
integrationRoutes.get(
  "/company/:companyId",
  integrationController.getIntegrationsByCompanyId
);

// Get integrations by userId
integrationRoutes.get(
  "/user/:userId",
  integrationController.getIntegrationsByUserId
);

// Update integration
integrationRoutes.put("/:id", integrationController.updateIntegration);

// Delete integration
integrationRoutes.delete("/:id", integrationController.deleteIntegration);
