// routes/report_routes.js
import { Router } from "express";
import {
    getDashboardStats,
    getAppointmentTrends,
    getDepartmentDistribution,
    getPatientGrowth,
    getRevenueReport,
    exportReport,
} from "../controllers/report_controller.js";
import { authenticate } from "../middleware/auth_middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard overview stats
router.get("/stats", getDashboardStats);

// Appointment trends (line chart)
router.get("/appointment-trends", getAppointmentTrends);

// Department distribution (donut chart)
router.get("/department-distribution", getDepartmentDistribution);

// Patient growth (line chart)
router.get("/patient-growth", getPatientGrowth);

// Revenue report (bar chart)
router.get("/revenue", getRevenueReport);

// Export report (CSV)
router.get("/export", exportReport);

export default router;