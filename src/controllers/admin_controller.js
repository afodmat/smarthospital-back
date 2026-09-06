// controllers/admin_controller.js
import { prisma } from "../config/db.js";
import { hashPassword } from "../lib/hash.js";
import { adminValidator } from "../validators/admin_validator.js";
import { sendVerificationEmail } from "../lib/verification_email.js";
// import { NotificationService } from "../services/notification_service.js";

// ========================================
// CREATE ADMIN (Super Admin only)
// ========================================

export const createAdminController = async (req, res) => {
    try {
        // ✅ Only Super Admin can create other admins
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only Super Admins can create new admins."
            });
        }

        const result = adminValidator.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten()
            });
        }

        const { firstName, lastName, email, password, phoneNumber, role } = result.data;
        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already in use"
            });
        }

        const passwordHash = await hashPassword(password);

        // Create admin user
        const newAdmin = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    firstName,
                    lastName,
                    email: normalizedEmail,
                    password: passwordHash,
                    role,
                    isEmailVerified: false,
                    twoFactorEnabled: false,
                }
            });

            // Create admin profile if needed (you can add an Admin model)
            // For now, just return the user with admin role

            return user;
        });

        await sendVerificationEmail(newAdmin);

        //notification service will be added later
        // Send notification to new admin
        // await NotificationService.notifyAdminAccountCreated(
        //     newAdmin.id,
        //     newAdmin.firstName,
        //     newAdmin.email,
        //     newAdmin.role
        // );

        return res.status(201).json({
            success: true,
            message: `${newAdmin.role} created successfully. A verification email has been sent.`,
            verificationRequired: true,
            data: {
                id: newAdmin.id,
                firstName: newAdmin.firstName,
                lastName: newAdmin.lastName,
                email: newAdmin.email,
                role: newAdmin.role,
            }
        });

    } catch (error) {
        console.error('Create admin error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========================================
// GET ALL ADMINS (Super Admin only)
// ========================================

export const getAllAdminsController = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only Super Admins can view all admins."
            });
        }

        const admins = await prisma.user.findMany({
            where: {
                role: { in: ['ADMIN', 'SUPER_ADMIN'] },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                otherNames: true,
                email: true,
                role: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            count: admins.length,
            data: admins
        });

    } catch (error) {
        console.error('Get all admins error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getAdminByIdController = async (req, res) => {
    try {
        const adminId = parseInt(req.params.id);

        if (isNaN(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID"
            });
        }

        // Only Super Admin can view admin details
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only Super Admins can view admin details."
            });
        }

        const admin = await prisma.user.findFirst({
            where: {
                id: adminId,

            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                otherNames: true,
                email: true,
                role: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        if (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN') {
            return res.status(400).json({
                success: false,
                message: "User is not an admin"
            });
        }

        return res.status(200).json({
            success: true,
            data: admin
        });

    } catch (error) {
        console.error('Get admin by ID error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========================================
// DELETE ADMIN (Super Admin only)
// ========================================

export const deleteAdminController = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only Super Admins can delete admins."
            });
        }

        const adminId = parseInt(req.params.id);

        if (isNaN(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID"
            });
        }

        // Prevent self-deletion
        if (adminId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account"
            });
        }

        const admin = await prisma.user.findUnique({
            where: { id: adminId }
        });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        if (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN') {
            return res.status(400).json({
                success: false,
                message: "User is not an admin"
            });
        }

        // Soft delete
        await prisma.user.update({
            where: { id: adminId },
            data: { deletedAt: new Date() }
        });

        return res.status(200).json({
            success: true,
            message: "Admin deleted successfully"
        });

    } catch (error) {
        console.error('Delete admin error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const restoreAdminController = async (req, res) => {
    try {
        const adminId = parseInt(req.params.id);

        if (isNaN(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID"
            });
        }

        // Only Super Admin can restore admins
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only Super Admins can restore admins."
            });
        }

        const existingAdmin = await prisma.user.findUnique({
            where: { id: adminId }
        });

        if (!existingAdmin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        const restoredAdmin = await prisma.user.update({
            where: { id: adminId },
            data: { deletedAt: null },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isEmailVerified: true,
            }
        });

        return res.status(200).json({
            success: true,
            message: "Admin restored successfully",
            data: restoredAdmin
        });

    } catch (error) {
        console.error('Restore admin error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// ========================================
// UPDATE ADMIN (Super Admin only)
// ========================================

export const updateAdminController = async (req, res) => {
    try {
        // Only Super Admin can update admins
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Only Super Admins can update admins."
            });
        }

        const adminId = parseInt(req.params.id);

        if (isNaN(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID"
            });
        }

        // Find the admin
        const existingAdmin = await prisma.user.findUnique({
            where: { id: adminId }
        });

        if (!existingAdmin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        // Make sure the target is actually an admin
        if (
            existingAdmin.role !== 'ADMIN' &&
            existingAdmin.role !== 'SUPER_ADMIN'
        ) {
            return res.status(400).json({
                success: false,
                message: "User is not an admin"
            });
        }

        // Prevent a Super Admin from changing their own role
        if (
            adminId === req.user.id &&
            req.body.role &&
            req.body.role !== 'SUPER_ADMIN'
        ) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own Super Admin role."
            });
        }

        const {
            firstName,
            lastName,
            otherNames,
            email,
            role,
            password
        } = req.body;

        // Check email uniqueness if email is being changed
        if (email && email.toLowerCase().trim() !== existingAdmin.email) {

            const emailExists = await prisma.user.findUnique({
                where: {
                    email: email.toLowerCase().trim()
                }
            });

            if (emailExists && emailExists.id !== adminId) {
                return res.status(409).json({
                    success: false,
                    message: "Email already in use"
                });
            }
        }

        const updateData = {};

        if (firstName !== undefined) {
            updateData.firstName = firstName.trim();
        }

        if (lastName !== undefined) {
            updateData.lastName = lastName.trim();
        }

        if (otherNames !== undefined) {
            updateData.otherNames = otherNames
                ? otherNames.trim()
                : null;
        }

        if (email !== undefined) {
            updateData.email = email.toLowerCase().trim();
        }

        if (role !== undefined) {
            if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid admin role"
                });
            }

            updateData.role = role;
        }

        // Password is optional during editing
        if (password) {
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 8 characters"
                });
            }

            updateData.password = await hashPassword(password);
        }

        const updatedAdmin = await prisma.user.update({
            where: {
                id: adminId
            },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                otherNames: true,
                email: true,
                role: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true
            }
        });

        return res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            data: updatedAdmin
        });

    } catch (error) {
        console.error("Update admin error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

