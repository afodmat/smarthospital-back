// routes/doctor_routes.js
import express from 'express';
import {
    getAllDoctorsController,
    getMyDoctorController,
    getDoctorByIdController,
    createDoctorController,
    updateDoctorProfileController,
    deleteDoctorController, getDoctorsForAppointmentController,
    resendDoctorVerificationController
} from '../controllers/doctor_controller.js';
import { authenticate, authorize , isOwnerOrAdmin } from '../middleware/auth_middleware.js';

const router = express.Router();

// Public routes (require authentication)
router.get( '/:id', authenticate, isOwnerOrAdmin('id', 'doctor'), getDoctorByIdController );
router.get( '/available', authenticate, getDoctorsForAppointmentController );
router.get( '/me', authenticate, getMyDoctorController );
// Admin only routes
router.get('/', authenticate,authorize(['SUPER_ADMIN', 'ADMIN']), getAllDoctorsController);
router.post( '/', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), createDoctorController );
router.put( '/:id', authenticate, isOwnerOrAdmin('id', 'doctor'), updateDoctorProfileController );
router.delete( '/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), deleteDoctorController );
router.post(
  "/:id/resend-verification",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  resendDoctorVerificationController
);
export default router;