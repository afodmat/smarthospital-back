import { Router } from "express";
import { authenticate } from "../middleware/auth_middleware.js";
import { getAllPatientsController, getMyPatientController, 
    getPatientByIdController, updatePatientProfileController, } from "../controllers/patient_controller.js";
import { getAllPrescriptionsController, getPrescriptionByIdController, 
    getPrescriptionsByPatientController, 
    createPrescriptionController, updatePrescriptionController, 
    deletePrescriptionController, getMyPrescriptionsController,
getPrescriptionsByDoctorController } from "../controllers/prescription_controller.js";

const router = Router();

// get all prescriptions for logged in patient
router.get("/patient/me", authenticate, getMyPrescriptionsController);

// get all prescriptions (admin only)
router.get("/", authenticate, getAllPrescriptionsController);

// doctor's own prescriptions
router.get("/doctor/me", authenticate, getPrescriptionsByDoctorController);

// get prescription by id
router.get("/:id", authenticate, getPrescriptionByIdController);

// create prescription
router.post("/", authenticate, createPrescriptionController);

// update prescription
router.put("/:id", authenticate, updatePrescriptionController);

// delete prescription
router.delete("/:id", authenticate, deletePrescriptionController);

export default router;
