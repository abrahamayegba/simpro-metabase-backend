import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../auth/utils";

export const userControllers = {
  // ======================
  // GET USERS FOR A COMPANY
  // ======================
  getUsers: async (req: Request, res: Response) => {
    try {
      const companyId = req.query.companyId as string;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "companyId is required",
        });
      }

      const users = await prisma.userCompany.findMany({
        where: { companyId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              createdAt: true,
            },
          },
          role: true,
        },
        orderBy: { createdAt: "asc" },
      });

      res.status(200).json({
        success: true,
        users: users.map((uc) => ({
          id: uc.user.id,
          name: uc.user.name,
          email: uc.user.email,
          isActive: uc.user.isActive,
          role: uc.role?.name ?? null,
        })),
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching users",
      });
    }
  },

  // ======================
  // GET USER BY ID (IN COMPANY)
  // ======================
  getUserById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.query.companyId as string;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "companyId is required",
        });
      }

      const userCompany = await prisma.userCompany.findUnique({
        where: {
          userId_companyId: { userId: id, companyId },
        },
        include: {
          user: true,
          role: true,
        },
      });

      if (!userCompany) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res.status(200).json({
        success: true,
        user: {
          id: userCompany.user.id,
          name: userCompany.user.name,
          email: userCompany.user.email,
          isActive: userCompany.user.isActive,
          role: userCompany.role?.name ?? null,
        },
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching user",
      });
    }
  },

  // ======================
  // CREATE USER (IN COMPANY)
  // ======================
  createUser: async (req: Request, res: Response) => {
    try {
      const { name, email, password, roleId, companyId } = req.body;

      if (!name || !email || !password || !roleId || !companyId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const existing = await prisma.user.findUnique({ where: { email } });

      let userId: string;

      if (existing) {
        userId = existing.id;

        const alreadyLinked = await prisma.userCompany.findUnique({
          where: {
            userId_companyId: { userId, companyId },
          },
        });

        if (alreadyLinked) {
          return res.status(409).json({
            success: false,
            message: "User already exists in this company",
          });
        }
      } else {
        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
          data: {
            name,
            email,
            passwordHash,
          },
        });

        userId = user.id;
      }

      await prisma.userCompany.create({
        data: {
          userId,
          companyId,
          roleId,
        },
      });

      res.status(201).json({
        success: true,
        message: "User added to company",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while creating user",
      });
    }
  },

  // ======================
  // UPDATE USER (NAME / EMAIL / ROLE)
  // ======================
  updateUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, email, isActive, roleId, companyId } = req.body;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "companyId is required",
        });
      }

      if (name || email || isActive !== undefined) {
        await prisma.user.update({
          where: { id },
          data: {
            ...(name !== undefined && { name }),
            ...(email !== undefined && { email }),
            ...(isActive !== undefined && { isActive }),
          },
        });
      }

      if (roleId) {
        await prisma.userCompany.update({
          where: {
            userId_companyId: { userId: id, companyId },
          },
          data: { roleId },
        });
      }

      res.status(200).json({
        success: true,
        message: "User updated",
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      console.error("Error updating user:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while updating user",
      });
    }
  },

  // ======================
  // REMOVE USER FROM COMPANY
  // ======================
  deleteUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.query.companyId as string;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "companyId is required",
        });
      }

      await prisma.userCompany.delete({
        where: {
          userId_companyId: { userId: id, companyId },
        },
      });

      // revoke sessions for this company
      await prisma.session.updateMany({
        where: {
          userId: id,
          activeCompanyId: companyId,
        },
        data: { revoked: true },
      });

      res.status(200).json({
        success: true,
        message: "User removed from company",
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      console.error("Error deleting user:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while deleting user",
      });
    }
  },
};
