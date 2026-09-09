import type { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
} from "../auth/utils";

const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 14);

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
};

export const authController = {
  // ======================
  // REGISTER
  // ======================
  register: async (req: Request, res: Response) => {
    try {
      const { name, email, password, companyName, companyEmail } = req.body;

      if (!name || !email || !password || !companyName) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email already in use",
        });
      }

      const passwordHash = await hashPassword(password);

      const adminRole = await prisma.role.findFirst({
        where: { name: "Admin" },
      });

      if (!adminRole) {
        return res.status(500).json({
          success: false,
          message: "Admin role not found",
        });
      }

      const user = await prisma.user.create({
        data: { name, email, passwordHash },
      });

      const company = await prisma.company.create({
        data: { name: companyName, email: companyEmail },
      });

      await prisma.userCompany.create({
        data: {
          userId: user.id,
          companyId: company.id,
          roleId: adminRole.id,
        },
      });

      return res.status(201).json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
        company: { id: company.id, name: company.name, email: company.email },
      });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // ======================
  // LOGIN
  // ======================
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Missing credentials",
        });
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          companies: { include: { company: true, role: true } },
        },
      });

      if (!user || !user.passwordHash) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const ok = await comparePassword(password, user.passwordHash);
      if (!ok) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
      if (!user.companies.length) {
        return res.status(403).json({
          success: false,
          message: "User is not assigned to any company",
        });
      }

      const activeCompany = user.companies[0];

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          activeCompanyId: activeCompany.companyId,
          userAgent: req.get("user-agent") ?? null,
          ip: req.ip,
          expiresAt: new Date(
            Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
          ),
        },
      });

      const accessToken = signAccessToken(user.id, user.email);
      const refreshToken = signRefreshToken(user.id, user.email, session.id);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      const refreshTokenHash = await hashPassword(refreshToken);
      await prisma.session.update({
        where: { id: session.id },
        data: { refreshTokenHash },
      });

      res.cookie("refreshToken", refreshToken, refreshCookieOptions);

      return res.json({
        success: true,
        accessToken,
        user: { id: user.id, name: user.name, email: user.email },
        company: {
          id: activeCompany.company.id,
          name: activeCompany.company.name,
          role: activeCompany.role?.name ?? null,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // ======================
  // REFRESH
  // ======================

  refresh: async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.refreshToken;

      if (!token) {
        return res.status(401).json({ success: false });
      }

      let payload;

      try {
        payload = verifyRefreshToken(token);
      } catch {
        return res.status(401).json({ success: false });
      }

      const sessionId = payload.jti as string;

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.revoked || session.expiresAt < new Date()) {
        return res.status(401).json({ success: false });
      }

      if (!session.refreshTokenHash) {
        return res.status(401).json({ success: false });
      }

      const ok = await comparePassword(token, session.refreshTokenHash);

      // Token reuse / tampering
      if (!ok) {
        await prisma.session.updateMany({
          where: { userId: session.userId },
          data: { revoked: true },
        });

        return res.status(401).json({ success: false });
      }

      // Revoke old session
      await prisma.session.update({
        where: { id: session.id },
        data: { revoked: true },
      });

      // Create new session
      const newExpiresAt = new Date(
        Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
      );

      const newSession = await prisma.session.create({
        data: {
          userId: session.userId,
          activeCompanyId: session.activeCompanyId,
          userAgent: req.get("user-agent") ?? null,
          ip: req.ip,
          expiresAt: newExpiresAt,
        },
      });

      // New refresh token
      const newRefreshToken = signRefreshToken(
        payload.sub as string,
        payload.email,
        newSession.id,
      );

      const newRefreshHash = await hashPassword(newRefreshToken);

      await prisma.session.update({
        where: { id: newSession.id },
        data: { refreshTokenHash: newRefreshHash },
      });

      // New access token
      const newAccessToken = signAccessToken(
        payload.sub as string,
        payload.email,
      );

      // Rotate cookies
      res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60 * 1000,
      });

      return res.json({
        success: true,
      });
    } catch (error) {
      console.error("Refresh error:", error);

      return res.status(500).json({ success: false });
    }
  },

  // ======================
  // LOGOUT
  // ======================
  logout: async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.refreshToken;

      if (token) {
        try {
          const payload = verifyRefreshToken(token);

          await prisma.session.update({
            where: { id: payload.jti as string },
            data: { revoked: true },
          });
        } catch {}
      }

      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ success: false });
    }
  },

  // ======================
  // ME
  // ======================
  me: async (req: Request, res: Response) => {
    try {
      const token =
        req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ success: false });
      }

      const payload = verifyAccessToken(token);
      const userId = payload.sub as string;

      const session = await prisma.session.findFirst({
        where: {
          userId,
          revoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!session) {
        return res.status(401).json({
          success: false,
          message: "Session expired",
        });
      }

      const userCompany = await prisma.userCompany.findUnique({
        where: {
          userId_companyId: {
            userId,
            companyId: session.activeCompanyId!,
          },
        },
        include: {
          role: true,
          company: true,
          user: true,
        },
      });

      return res.json({
        success: true,
        user: {
          id: userCompany!.user.id,
          name: userCompany!.user.name,
          email: userCompany!.user.email,
        },
        company: {
          id: userCompany!.company.id,
          name: userCompany!.company.name,
          role: userCompany!.role?.name ?? null,
        },
      });
    } catch (error) {
      console.error("Me error:", error);
      return res.status(500).json({ success: false });
    }
  },

  // ======================
  // CHANGE PASSWORD (authenticated)
  // ======================
  changePassword: async (req: Request, res: Response) => {
    try {
      const token =
        req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: "Missing token" });
      }

      const payload = verifyAccessToken(token);
      const userId = payload.sub as string;

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.passwordHash) {
        return res
          .status(400)
          .json({ success: false, message: "User not found" });
      }

      const ok = await comparePassword(oldPassword, user.passwordHash);
      if (!ok) {
        return res
          .status(401)
          .json({ success: false, message: "Old password incorrect" });
      }

      const newHash = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });

      // revoke all existing sessions
      await prisma.session.updateMany({
        where: { userId },
        data: { revoked: true },
      });

      return res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("changePassword error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  // ======================
  // PASSWORD RESET
  // ======================
  requestPasswordReset: async (req: Request, res: Response) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ success: true });

    const raw = crypto.randomBytes(32).toString("hex");
    const hash = await hashPassword(raw);

    await prisma.passwordReset.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
      update: {
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    res.json({ success: true });
  },

  confirmPasswordReset: async (req: Request, res: Response) => {
    const { userId, token, newPassword } = req.body;

    const pr = await prisma.passwordReset.findUnique({ where: { userId } });
    if (!pr) return res.status(400).json({ success: false });

    const ok = await comparePassword(token, pr.tokenHash);
    if (!ok) return res.status(400).json({ success: false });

    const hash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash },
    });

    await prisma.passwordReset.delete({ where: { userId } });
    res.json({ success: true });
  },
};
