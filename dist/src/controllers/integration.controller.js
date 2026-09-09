"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationController = void 0;
const prisma_1 = require("../lib/prisma");
exports.integrationController = {
    // ======================
    // CREATE / UPSERT INTEGRATION
    // ======================
    createIntegration: async (req, res) => {
        try {
            const { companyId, provider, apiKey, apiUrl, config } = req.body;
            if (!companyId || !provider) {
                return res.status(400).json({
                    success: false,
                    message: "companyId and provider are required",
                });
            }
            const integration = await prisma_1.prisma.integration.upsert({
                where: {
                    companyId_provider: {
                        companyId,
                        provider,
                    },
                },
                update: {
                    apiKey,
                    apiUrl,
                    config,
                },
                create: {
                    companyId,
                    provider,
                    apiKey,
                    apiUrl,
                    config,
                },
            });
            res.status(201).json({ success: true, integration });
        }
        catch (error) {
            console.error("Error creating integration:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },
    // ======================
    // UPDATE INTEGRATION
    // ======================
    updateIntegration: async (req, res) => {
        try {
            const { id } = req.params;
            const { apiKey, apiUrl, config } = req.body;
            const integration = await prisma_1.prisma.integration.update({
                where: { id },
                data: {
                    ...(apiKey !== undefined && { apiKey }),
                    ...(apiUrl !== undefined && { apiUrl }),
                    ...(config !== undefined && { config }),
                },
            });
            res.status(200).json({ success: true, integration });
        }
        catch (error) {
            if (error.code === "P2025") {
                return res
                    .status(404)
                    .json({ success: false, message: "Integration not found" });
            }
            console.error("Error updating integration:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },
    // ======================
    // DELETE INTEGRATION
    // ======================
    deleteIntegration: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma_1.prisma.integration.delete({ where: { id } });
            res.status(200).json({
                success: true,
                message: "Integration deleted",
            });
        }
        catch (error) {
            if (error.code === "P2025") {
                return res
                    .status(404)
                    .json({ success: false, message: "Integration not found" });
            }
            console.error("Error deleting integration:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },
    // ======================
    // GET INTEGRATIONS BY COMPANY
    // ======================
    getIntegrationsByCompanyId: async (req, res) => {
        try {
            const { companyId } = req.params;
            const integrations = await prisma_1.prisma.integration.findMany({
                where: { companyId },
                orderBy: { createdAt: "asc" },
            });
            res.status(200).json({ success: true, integrations });
        }
        catch (error) {
            console.error("Error fetching integrations:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },
    // ======================
    // GET INTEGRATIONS BY USER ID
    // ======================
    getIntegrationsByUserId: async (req, res) => {
        try {
            const { userId } = req.params;
            const memberships = await prisma_1.prisma.userCompany.findMany({
                where: { userId },
                select: {
                    companyId: true,
                },
            });
            const companyIds = memberships.map((m) => m.companyId);
            const integrations = await prisma_1.prisma.integration.findMany({
                where: {
                    companyId: { in: companyIds },
                },
                include: {
                    company: {
                        select: { id: true, name: true },
                    },
                },
            });
            res.status(200).json({
                success: true,
                integrations: integrations.map((i) => ({
                    id: i.id,
                    provider: i.provider,
                    company: {
                        id: i.company.id,
                        name: i.company.name,
                    },
                    apiUrl: i.apiUrl,
                    config: i.config,
                })),
            });
        }
        catch (error) {
            console.error("Error fetching integrations by userId:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },
    // ======================
    // GET ALL INTEGRATIONS
    // ======================
    getIntegrations: async (_req, res) => {
        try {
            const integrations = await prisma_1.prisma.integration.findMany({
                include: {
                    company: {
                        select: { id: true, name: true },
                    },
                },
            });
            res.status(200).json({ success: true, integrations });
        }
        catch (error) {
            console.error("Error fetching integrations:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    },
};
