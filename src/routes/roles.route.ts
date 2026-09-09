import { Router } from "express";
import { roleController } from "../controllers/role.controller";

export const roleRoutes = Router();

// Create role
roleRoutes.post("/", roleController.createRole);

// Get all roles
roleRoutes.get("/", roleController.getRoles);

// Get role by id
roleRoutes.get("/:id", roleController.getRoleById);

// Get roles by userId
roleRoutes.get("/user/:userId", roleController.getRolesByUserId);

// Update role
roleRoutes.put("/:id", roleController.updateRole);

// Delete role
roleRoutes.delete("/:id", roleController.deleteRole);
