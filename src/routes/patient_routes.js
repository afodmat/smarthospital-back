import { Router } from "express";
import { authenticate } from "../middleware/auth_middleware.js";
import { getAllPatientsController, getMyPatientController, getPatientByIdController, updatePatientProfileController } from "../controllers/patient_controller.js";

const router = Router();

router.get('/', getAllPatientsController);
router.get("/me", authenticate, getMyPatientController);
router.get("/:id", getPatientByIdController);
router.put("/update/:id", updatePatientProfileController);

export default router;