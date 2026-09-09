import { Router } from "express";
import { companyController } from "../controllers/company.controller";

export const companyRoutes = Router();

// Create company
companyRoutes.post("/", companyController.createCompany);

// Get all companies
companyRoutes.get("/", companyController.getCompanies);

// Get company by id
companyRoutes.get("/:id", companyController.getCompanyById);

// Get companies by userId
companyRoutes.get("/user/:userId", companyController.getCompaniesByUserId);

// Update company
companyRoutes.put("/:id", companyController.updateCompany);

// Delete company
companyRoutes.delete("/:id", companyController.deleteCompany);
