import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const roleController = {
  // ======================
  // CREATE ROLE
  // ======================
  createRole: async (req: Request, res: Response) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res
          .status(400)
          .json({ success: false, message: "Role name is required" });
      }

      const existing = await prisma.role.findFirst({ where: { name } });
      if (existing) {
        return res
          .status(409)
          .json({ success: false, message: "Role already exists" });
      }

      const role = await prisma.role.create({
        data: { name },
      });

      res.status(201).json({ success: true, role });
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // ======================
  // GET ALL ROLES
  // ======================
  getRoles: async (_: Request, res: Response) => {
    try {
      const roles = await prisma.role.findMany({
        include: {
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      res.status(200).json({
        success: true,
        roles: roles.map((r) => ({
          id: r.id,
          name: r.name,
          usersCount: r._count.users,
        })),
      });
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // ======================
  // GET ROLE BY ID
  // ======================
  getRoleById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const role = await prisma.role.findUnique({
        where: { id },
        include: {
          users: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              company: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (!role) {
        return res
          .status(404)
          .json({ success: false, message: "Role not found" });
      }

      res.status(200).json({
        success: true,
        role: {
          id: role.id,
          name: role.name,
          assignments: role.users.map((uc) => ({
            user: uc.user,
            company: uc.company,
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // ======================
  // GET ROLE BY USER ID
  // ======================
  // returns the user's role per company
  getRolesByUserId: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const memberships = await prisma.userCompany.findMany({
        where: { userId },
        include: {
          role: true,
          company: {
            select: { id: true, name: true },
          },
        },
      });

      res.status(200).json({
        success: true,
        roles: memberships.map((uc) => ({
          companyId: uc.company.id,
          companyName: uc.company.name,
          roleId: uc.role?.id ?? null,
          roleName: uc.role?.name ?? null,
        })),
      });
    } catch (error) {
      console.error("Error fetching roles by userId:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // ======================
  // UPDATE ROLE
  // ======================
  updateRole: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
        return res
          .status(400)
          .json({ success: false, message: "Role name is required" });
      }

      const role = await prisma.role.update({
        where: { id },
        data: { name },
      });

      res.status(200).json({ success: true, role });
    } catch (error: any) {
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ success: false, message: "Role not found" });
      }

      console.error("Error updating role:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // ======================
  // DELETE ROLE
  // ======================
  deleteRole: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const usage = await prisma.userCompany.count({
        where: { roleId: id },
      });

      if (usage > 0) {
        return res.status(409).json({
          success: false,
          message: "Role is assigned to users and cannot be deleted",
        });
      }

      await prisma.role.delete({ where: { id } });

      res.status(200).json({ success: true, message: "Role deleted" });
    } catch (error: any) {
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ success: false, message: "Role not found" });
      }

      console.error("Error deleting role:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
};
