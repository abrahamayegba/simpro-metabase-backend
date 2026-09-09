"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleRoutes = void 0;
const express_1 = require("express");
const role_controller_1 = require("../controllers/role.controller");
exports.roleRoutes = (0, express_1.Router)();
// Create role
exports.roleRoutes.post("/", role_controller_1.roleController.createRole);
// Get all roles
exports.roleRoutes.get("/", role_controller_1.roleController.getRoles);
// Get role by id
exports.roleRoutes.get("/:id", role_controller_1.roleController.getRoleById);
// Get roles by userId
exports.roleRoutes.get("/user/:userId", role_controller_1.roleController.getRolesByUserId);
// Update role
exports.roleRoutes.put("/:id", role_controller_1.roleController.updateRole);
// Delete role
exports.roleRoutes.delete("/:id", role_controller_1.roleController.deleteRole);
