import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const integrationController = {
  // ======================
  // CREATE / UPSERT INTEGRATION
  // ======================
  createIntegration: async (req: Request, res: Response) => {
    try {
      const { companyId, provider, apiKey, apiUrl, config } = req.body;

      if (!companyId || !provider) {
        return res.status(400).json({
          success: false,
          message: "companyId and provider are required",
        });
      }

      const integration = await prisma.integration.upsert({
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
    } catch (error) {
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
  updateIntegration: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { apiKey, apiUrl, config } = req.body;

      const integration = await prisma.integration.update({
        where: { id },
        data: {
          ...(apiKey !== undefined && { apiKey }),
          ...(apiUrl !== undefined && { apiUrl }),
          ...(config !== undefined && { config }),
        },
      });

      res.status(200).json({ success: true, integration });
    } catch (error: any) {
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
  deleteIntegration: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.integration.delete({ where: { id } });

      res.status(200).json({
        success: true,
        message: "Integration deleted",
      });
    } catch (error: any) {
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
  getIntegrationsByCompanyId: async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;

      const integrations = await prisma.integration.findMany({
        where: { companyId },
        orderBy: { createdAt: "asc" },
      });

      res.status(200).json({ success: true, integrations });
    } catch (error) {
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
  getIntegrationsByUserId: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const memberships = await prisma.userCompany.findMany({
        where: { userId },
        select: {
          companyId: true,
        },
      });

      const companyIds = memberships.map((m) => m.companyId);

      const integrations = await prisma.integration.findMany({
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
    } catch (error) {
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
  getIntegrations: async (_req: Request, res: Response) => {
    try {
      const integrations = await prisma.integration.findMany({
        include: {
          company: {
            select: { id: true, name: true },
          },
        },
      });

      res.status(200).json({ success: true, integrations });
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
};
