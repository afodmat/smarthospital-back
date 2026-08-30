import { Router } from "express";
import { forgotPasswordController, googleAuthCallBackController,resendVerificationController, googleAuthStartController, loginController, logoutController, refreshController, registerController, resetPasseordController, twoFactorAuthenticationSetupController, twoFactorAuthenticationverificationController, verifyEmailController } from "../controllers/auth_controller.js";

const router = Router();

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