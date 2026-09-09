"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
exports.authRoutes = (0, express_1.Router)();
// ======================
// AUTH
// ======================
// Register
exports.authRoutes.post("/register", auth_controller_1.authController.register);
// Login
exports.authRoutes.post("/login", auth_controller_1.authController.login);
// Logout (revoke session)
exports.authRoutes.post("/logout", auth_controller_1.authController.logout);
// Refresh access token
exports.authRoutes.post("/refresh", auth_controller_1.authController.refresh);
// Get current authenticated user
exports.authRoutes.get("/me", auth_controller_1.authController.me);
// ======================
// PASSWORD
// ======================
// Change password (authenticated)
exports.authRoutes.post("/password/change", auth_controller_1.authController.changePassword);
// Request password reset (forgot password)
exports.authRoutes.post("/password/reset/request", auth_controller_1.authController.requestPasswordReset);
// Confirm password reset
exports.authRoutes.post("/password/reset/confirm", auth_controller_1.authController.confirmPasswordReset);
