// src/controllers/dashboard_controller.js

import { prisma } from "../config/db.js";
import jwt from "jsonwebtoken";

async function getAuthenticatedUser(req) {
    try {
         console.log('🔍 getAuthenticatedUser called');
        console.log('📦 Cookies:', req.cookies);
        // ✅ Read access token from cookie
        let token = req.cookies?.accessToken;
         console.log('🔑 Token from cookie:', token ? 'exists' : 'not found');
        
        // If not in cookie, try Authorization header (for API calls)
        if (!token) {
            token = req.headers.authorization?.split(' ')[1];
            console.log('🔑 Token from header:', token ? 'exists' : 'not found');
        }

        if (!token) {
            return null;
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            select: {
                id: true,
                role: true,
                firstName: true,
                lastName: true,
                email: true,
                isEmailVerified: true,
            }
        });

        return user;
    } catch (error) {
        console.error('Auth helper error:', error.message);
        return null;
    }
}


export const redirectToDashboard = async (req, res) => {
    try {
        console.log('🚀 redirectToDashboard called!');
        console.log('📦 Request URL:', req.url);
        console.log('📦 Request method:', req.method);

        const token =
            req.cookies?.accessToken ||
            req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
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
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: "Email not verified"
            });
        }

        const FRONTEND_URL =
            process.env.FRONTEND_URL ||
            "http://127.0.0.1:5500";

        let dashboardUrl;

        switch (user.role) {
            case "SUPER_ADMIN":
            case "ADMIN":
                dashboardUrl = `${FRONTEND_URL}/sa_dashboard.html`;
                break;

            case "DOCTOR":
                dashboardUrl = `${FRONTEND_URL}/doc_dashboard.html`;
                break;

            case "PATIENT":
                dashboardUrl = `${FRONTEND_URL}/patient_dashboard.html`;
                break;

            case "NURSE":
                dashboardUrl = `${FRONTEND_URL}/nurse_dashboard.html`;
                break;

            case "RECEPTIONIST":
                dashboardUrl = `${FRONTEND_URL}/receptionist_dashboard.html`;
                break;

            default:
                return res.status(403).json({
                    success: false,
                    message: "Unknown user role"
                });
        }

        return res.status(200).json({
            success: true,
            dashboardUrl
        });

    } catch (error) {
        console.error("Dashboard redirect error:", error);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

export const redirectToPatientDashboard = async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/login.html`);
        }

        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';

        if (user.role !== 'PATIENT' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            return res.status(403).send(`
                <!DOCTYPE html>
                <html>
                <head><title>Access Denied</title></head>
                <body>
                    <h1>Access Denied</h1>
                    <p>You don't have permission to view the patient dashboard.</p>
                    <a href="/auth/dashboard">Go to your dashboard</a>
                </body>
                </html>
            `);
        }

        return res.redirect(`${FRONTEND_URL}/patient-dashboard.html`);
    } catch (error) {
        console.error('Patient dashboard redirect error:', error.message);
        return res.redirect(`${process.env.FRONTEND_URL}/login.html`);
    }
};

/**
 * Redirect to doctor dashboard (with auth check)
 */
export const redirectToDoctorDashboard = async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/login.html`);
        }

        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';

        if (user.role !== 'DOCTOR' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            return res.status(403).send(`
                <!DOCTYPE html>
                <html>
                <head><title>Access Denied</title></head>
                <body>
                    <h1>Access Denied</h1>
                    <p>You don't have permission to view the doctor dashboard.</p>
                    <a href="/auth/dashboard">Go to your dashboard</a>
                </body>
                </html>
            `);
        }

        return res.redirect(`${FRONTEND_URL}/doctor-dashboard.html`);
    } catch (error) {
        console.error('Doctor dashboard redirect error:', error.message);
        return res.redirect(`${process.env.FRONTEND_URL}/login.html`);
    }
};

/**
 * Redirect to admin dashboard (with auth check)
 */
export const redirectToAdminDashboard = async (req, res) => {
    try {
        const user = await getAuthenticatedUser(req);
        
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/login.html`);
        }

        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';

        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            return res.status(403).send(`
                <!DOCTYPE html>
                <html>
                <head><title>Access Denied</title></head>
                <body>
                    <h1>Access Denied</h1>
                    <p>You don't have permission to view the admin dashboard.</p>
                    <a href="/auth/dashboard">Go to your dashboard</a>
                </body>
                </html>
            `);
        }

        return res.redirect(`${FRONTEND_URL}/sa-dashboard.html`);
    } catch (error) {
        console.error('Admin dashboard redirect error:', error.message);
        return res.redirect(`${process.env.FRONTEND_URL}/login.html`);
    }
};
