// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

/**
 * Middleware to authenticate a user
 * Extracts JWT from cookie or Authorization header
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        const token =
            req.cookies?.accessToken ||
            (authHeader?.startsWith("Bearer ")
                ? authHeader.split(" ")[1]
                : null);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET
        );

        const user = await prisma.user.findUnique({
            where: {
                id: Number(decoded.sub)
            },
            select: {
                id: true,
                role: true,
                firstName: true,
                lastName: true,
                email: true,
                isEmailVerified: true,
                tokenVersion: true
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found."
            });
        }

        if (user.tokenVersion !== decoded.tokenVersion) {
            return res.status(401).json({
                success: false,
                message: "Session invalidated. Please log in again."
            });
        }

        req.user = user;

        next();

    } catch (error) {

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired."
            });
        }

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid token. Please log in again."
            });
        }

        console.error("Authentication error:", error);

        return res.status(500).json({
            success: false,
            message: "Authentication failed."
        });
    }
};

/**
 * Middleware to check if user has required role(s)
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Middleware to check if user is accessing their own resource or is admin
 * @param {string} paramName - The route parameter name for the ID (e.g., 'id')
 * @param {string} modelName - The Prisma model name (e.g., 'patient', 'doctor')
 */
export const isOwnerOrAdmin = (paramName = 'id', modelName = 'user') => {
    return async (req, res, next) => {
        try {
            const userId = parseInt(req.params[paramName]);
            const currentUser = req.user;

            // Admin and Super Admin can access any resource
            if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') {
                return next();
            }

            // For patients and doctors, check if they own the resource
            if (modelName === 'patient') {
                const patient = await prisma.patient.findUnique({
                    where: { id: userId },
                    select: { userId: true }
                });

                if (patient && patient.userId === currentUser.id) {
                    return next();
                }
            }

            if (modelName === 'doctor') {
                const doctor = await prisma.doctor.findUnique({
                    where: { id: userId },
                    select: { userId: true }
                });

                if (doctor && doctor.userId === currentUser.id) {
                    return next();
                }
            }

            // For general user resource
            if (modelName === 'user' && userId === currentUser.id) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your own resources.'
            });

        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authorization failed.'
            });
        }
    };
};