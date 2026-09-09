import { Router } from "express";
import { authController } from "../controllers/auth.controller";

export const authRoutes = Router();

// ======================
// AUTH
// ======================

// Register
authRoutes.post("/register", authController.register);

// Login
authRoutes.post("/login", authController.login);

// Logout (revoke session)
authRoutes.post("/logout", authController.logout);

// Refresh access token
authRoutes.post("/refresh", authController.refresh);

// Get current authenticated user
authRoutes.get("/me", authController.me);

// ======================
// PASSWORD
// ======================

// Change password (authenticated)
authRoutes.post("/password/change", authController.changePassword);

// Request password reset (forgot password)
authRoutes.post("/password/reset/request", authController.requestPasswordReset);

// Confirm password reset
authRoutes.post("/password/reset/confirm", authController.confirmPasswordReset);
