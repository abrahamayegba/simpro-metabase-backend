"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyRoutes = void 0;
const express_1 = require("express");
const company_controller_1 = require("../controllers/company.controller");
exports.companyRoutes = (0, express_1.Router)();
// Create company
exports.companyRoutes.post("/", company_controller_1.companyController.createCompany);
// Get all companies
exports.companyRoutes.get("/", company_controller_1.companyController.getCompanies);
// Get company by id
exports.companyRoutes.get("/:id", company_controller_1.companyController.getCompanyById);
// Get companies by userId
exports.companyRoutes.get("/user/:userId", company_controller_1.companyController.getCompaniesByUserId);
// Update company
exports.companyRoutes.put("/:id", company_controller_1.companyController.updateCompany);
// Delete company
exports.companyRoutes.delete("/:id", company_controller_1.companyController.deleteCompany);
