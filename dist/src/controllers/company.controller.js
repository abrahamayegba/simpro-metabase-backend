"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyController = void 0;
const prisma_1 = require("../lib/prisma");
exports.companyController = {
    // ======================
    // CREATE COMPANY
    // ======================
    createCompany: async (req, res) => {
        try {
            const { name, email, industry, ownerUserId, ownerRoleId } = req.body;
            if (!name || !ownerUserId || !ownerRoleId) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields",
                });
            }
            const company = await prisma_1.prisma.company.create({
                data: {
                    name,
                    email,
                    industry,
                },
            });
            // link creator to company
            await prisma_1.prisma.userCompany.create({
                data: {
                    userId: ownerUserId,
                    companyId: company.id,
                    roleId: ownerRoleId,
                },
            });
            res.status(201).json({
                success: true,
                company,
            });
        }
        catch (error) {
            console.error("Error creating company:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },
    // ======================
    // GET ALL COMPANIES
    // ======================
    getCompanies: async (_, res) => {
        try {
            const companies = await prisma_1.prisma.company.findMany({
                orderBy: { createdAt: "asc" },
            });
            res.status(200).json({
                success: true,
                companies,
            });
        }
        catch (error) {
            console.error("Error fetching companies:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },
    // ======================
    // GET COMPANY BY ID
    // ======================
    getCompanyById: async (req, res) => {
        try {
            const { id } = req.params;
            const company = await prisma_1.prisma.company.findUnique({
                where: { id },
                include: {
                    users: {
                        include: {
                            user: {
                                select: { id: true, name: true, email: true },
                            },
                            role: true,
                        },
                    },
                },
            });
            if (!company) {
                return res
                    .status(404)
                    .json({ success: false, message: "Company not found" });
            }
            res.status(200).json({
                success: true,
                company: {
                    id: company.id,
                    name: company.name,
                    email: company.email,
                    industry: company.industry,
                    users: company.users.map((uc) => ({
                        id: uc.user.id,
                        name: uc.user.name,
                        email: uc.user.email,
                        role: uc.role?.name ?? null,
                    })),
                },
            });
        }
        catch (error) {
            console.error("Error fetching company:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },
    // ======================
    // GET COMPANIES BY USER ID
    // ======================
    getCompaniesByUserId: async (req, res) => {
        try {
            const { userId } = req.params;
            const memberships = await prisma_1.prisma.userCompany.findMany({
                where: { userId },
                include: {
                    company: true,
                    role: true,
                },
            });
            res.status(200).json({
                success: true,
                companies: memberships.map((uc) => ({
                    id: uc.company.id,
                    name: uc.company.name,
                    email: uc.company.email,
                    industry: uc.company.industry,
                    role: uc.role?.name ?? null,
                })),
            });
        }
        catch (error) {
            console.error("Error fetching companies by userId:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },
    // ======================
    // UPDATE COMPANY
    // ======================
    updateCompany: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, industry, isActive } = req.body;
            const company = await prisma_1.prisma.company.update({
                where: { id },
                data: {
                    ...(name !== undefined && { name }),
                    ...(email !== undefined && { email }),
                    ...(industry !== undefined && { industry }),
                    ...(isActive !== undefined && { isActive }),
                },
            });
            res.status(200).json({
                success: true,
                company,
            });
        }
        catch (error) {
            if (error.code === "P2025") {
                return res
                    .status(404)
                    .json({ success: false, message: "Company not found" });
            }
            console.error("Error updating company:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },
    // ======================
    // DELETE COMPANY
    // ======================
    deleteCompany: async (req, res) => {
        try {
            const { id } = req.params;
            // revoke all sessions for this company
            await prisma_1.prisma.session.updateMany({
                where: { activeCompanyId: id },
                data: { revoked: true },
            });
            // remove memberships
            await prisma_1.prisma.userCompany.deleteMany({
                where: { companyId: id },
            });
            // delete company
            await prisma_1.prisma.company.delete({
                where: { id },
            });
            res.status(200).json({
                success: true,
                message: "Company deleted",
            });
        }
        catch (error) {
            if (error.code === "P2025") {
                return res
                    .status(404)
                    .json({ success: false, message: "Company not found" });
            }
            console.error("Error deleting company:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },
};
