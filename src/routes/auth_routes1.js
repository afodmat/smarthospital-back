import { Router } from "express";
import { forgotPasswordController, googleAuthCallBackController,
    resendVerificationController, googleAuthStartController, loginController, 
    logoutController, refreshController, registerController, resetPasseordController, 
    twoFactorAuthenticationSetupController, twoFactorAuthenticationverificationController,
     verifyEmailController } from "../controllers/auth_controller.js";
import { redirectToDashboard, redirectToAdminDashboard,
    redirectToDoctorDashboard, redirectToPatientDashboard
 } from "../controllers/dashboard_controller.js";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';
const loginUrl = `${FRONTEND_URL}/login.html`;
const registerUrl = `${FRONTEND_URL}/register.html`;

router.get("/dashboard", redirectToDashboard);
router.get("/dashboard/patient", redirectToPatientDashboard);
router.get("/dashboard/doctor", redirectToDoctorDashboard);
router.get("/dashboard/admin", redirectToAdminDashboard);
router.post("/register", registerController);
router.get("/verify-email", verifyEmailController);
router.post('/resend-verification', resendVerificationController);
router.post("/login", loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
router.post("/forgotPassword", forgotPasswordController);
router.post("/resetPassword", resetPasseordController);
router.get("/goole-auth", googleAuthStartController);
router.get("/google-auth/callback", googleAuthCallBackController);
router.post("/2fasetup", twoFactorAuthenticationSetupController);
router.post("/2fa/verify", twoFactorAuthenticationverificationController);

export default router;