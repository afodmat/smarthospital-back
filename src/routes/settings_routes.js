// routes/setting_routes.js
import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/setting_controller.js";
import { authenticate } from "../middleware/auth_middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getSettings);
router.put("/", updateSettings);

export default router;