import { Router } from "express";
import { userControllers } from "../controllers/user.controller";

export const userRoutes = Router();

// Get users in a company
userRoutes.get("/", userControllers.getUsers);

// Get user by id (within company)
userRoutes.get("/:id", userControllers.getUserById);

// Create user in company
userRoutes.post("/", userControllers.createUser);

// Update user
userRoutes.put("/:id", userControllers.updateUser);

// Remove user from company
userRoutes.delete("/:id", userControllers.deleteUser);
