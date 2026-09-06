// routes/admin_routes.js

import { Router } from "express";

import {
    createAdminController,
    getAllAdminsController,
    getAdminByIdController,
    deleteAdminController,
    restoreAdminController, updateAdminController
} from "../controllers/admin_controller.js";

import {
    authenticate,
    authorize
} from "../middleware/auth_middleware.js";

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Only SUPER_ADMIN can manage admins
router.use(authorize(['SUPER_ADMIN']));

// Get all admins
router.get("/", getAllAdminsController);

// Get one admin
router.get("/:id", getAdminByIdController);

// Create admin
router.post("/", createAdminController);

// Delete admin
router.delete("/:id", deleteAdminController);

// Update admin
 router.put("/:id", updateAdminController);

// Restore admin
router.patch("/:id/restore", restoreAdminController);

export default router;