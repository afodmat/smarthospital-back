// routes/appointment_routes.js
import { Router } from "express";
import { prisma } from "../config/db.js";
import {
    getAllAppointments,
    getAppointmentById,
    getAppointmentsByPatient,
    getAppointmentsByDoctor,
    createAppointment,
    updateAppointment,
    deleteAppointment
} from "../controllers/appointment_controller.js";
import { authenticate, authorize } from "../middleware/auth_middleware.js";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ========================================
// PATIENT APPOINTMENT ROUTES
// ========================================

// Get all appointments for the logged-in patient
router.get("/patient/me", async (req, res) => {
    try {
        // Get the patient record for the logged-in user
        const patient = await prisma.patient.findUnique({
            where: { userId: req.user.id }
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient profile not found"
            });
        }

        // Forward to the controller with patient ID
        req.params.patientId = patient.id;
        return getAppointmentsByPatient(req, res);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Get appointments by patient ID (Admin only)
router.get("/patient/:patientId", authorize(['ADMIN', 'SUPER_ADMIN']), getAppointmentsByPatient);

// ========================================
// DOCTOR APPOINTMENT ROUTES
// ========================================

// Get all appointments for the logged-in doctor
router.get("/doctor/me", async (req, res) => {
    try {
        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id }
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        req.params.doctorId = doctor.id;
        return getAppointmentsByDoctor(req, res);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Get appointments by doctor ID (Admin only)
router.get("/doctor/:doctorId", authorize(['ADMIN', 'SUPER_ADMIN']), getAppointmentsByDoctor);

// ========================================
// GENERAL APPOINTMENT ROUTES
// ========================================

// Get all appointments (Admin only)
router.get("/", authorize(['ADMIN', 'SUPER_ADMIN']), getAllAppointments);

// Get appointment by ID
router.get("/:id", getAppointmentById);

// Create appointment
router.post("/create", createAppointment);

// Update appointment
router.put("/:id", updateAppointment);

// Delete appointment (soft delete)
router.delete("/:id", deleteAppointment);

export default router;