"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
exports.userRoutes = (0, express_1.Router)();
// Get users in a company
exports.userRoutes.get("/", user_controller_1.userControllers.getUsers);
// Get user by id (within company)
exports.userRoutes.get("/:id", user_controller_1.userControllers.getUserById);
// Create user in company
exports.userRoutes.post("/", user_controller_1.userControllers.createUser);
// Update user
exports.userRoutes.put("/:id", user_controller_1.userControllers.updateUser);
// Remove user from company
exports.userRoutes.delete("/:id", user_controller_1.userControllers.deleteUser);
