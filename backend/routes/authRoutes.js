import express from "express";
import {
  signup,
  login,
  verifyOtp,
  resendOtp,
  loginWithPassword,
  googleLogin,
} from "../controllers/authController.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Basic rate limit for auth endpoints (global)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(authLimiter);

// Stricter limits for sensitive routes
const tightLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
router.post("/login", tightLimiter, login);
router.post("/verify-otp", tightLimiter, verifyOtp);
router.post("/resend-otp", tightLimiter, resendOtp);

// OTP-based authentication (original)
router.post("/signup", signup);
// keep existing definitions removed above replaced by stricter ones

// Alternative authentication methods
router.post("/login-password", loginWithPassword);
router.post("/google-login", googleLogin);

export default router;
