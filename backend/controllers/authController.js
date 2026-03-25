import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  registerSchema,
  loginWithPasswordSchema,
} from "../validators/authValidation.js";
import { generateOtp } from "../utils/generateOTP.js";
import { sendOtpEmail } from "../utils/sendEmail.js";
// Google OAuth imports - optional
// import {
//   verifyGoogleToken,
//   verifyGoogleAccessToken,
// } from "../utils/googleAuth.js";

// ✅ Centralized admin email list
const ADMIN_EMAILS = ["yugalhemane2@gmail.com"];

// ✳️ Google OAuth Login Controller (Secure) - Temporarily disabled
import axios from "axios";

// ✅ JWT helper
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// ✳️ Signup Controller
export const signup = async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);
    const { name, email, password, phone } = validated;

    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res
        .status(409)
        .json({ success: false, message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const role = ADMIN_EMAILS.includes(email) ? "admin" : "user";

    await User.updateOne(
      { email },
      {
        $set: {
          name,
          email,
          password: hashedPassword,
          role,
          phone,
          isVerified: false,
          otp: { code: otpCode, expiresAt: otpExpires },
        },
      },
      { upsert: true }
    );

    // Try to send OTP email, but don't fail if SMTP is blocked
    try {
      await sendOtpEmail(email, otpCode);
      return res.status(200).json({
        success: true,
        message: "OTP sent to your email for verification",
      });
    } catch (emailError) {
      console.warn(
        "Email service unavailable during signup:",
        emailError.message
      );
      return res.status(200).json({
        success: true,
        message:
          "Account created! Email service temporarily unavailable. Use this OTP: " +
          otpCode,
        otp: otpCode, // Only for development/testing
      });
    }
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ✳️ OTP Verification Controller
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and OTP",
      });
    }

    const user = await User.findOne({ email });

    if (
      !user ||
      !user.otp ||
      String(user.otp.code) !== String(otp) ||
      new Date() > user.otp.expiresAt
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = {};
    await user.save();

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // ✅ Always include role
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ✳️ Login Controller
export const login = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.isVerified) {
      return res.status(404).json({
        success: false,
        message: "User not found or not verified. Please sign up first.",
      });
    }

    const otpCode = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = {
      code: otpCode,
      expiresAt: otpExpires,
    };

    await user.save();

    // Try to send OTP email, but don't fail if SMTP is blocked
    try {
      await sendOtpEmail(email, otpCode);
      return res.status(200).json({
        success: true,
        message: "OTP sent to your email",
      });
    } catch (emailError) {
      console.warn(
        "Email service unavailable during login:",
        emailError.message
      );
      return res.status(200).json({
        success: true,
        message:
          "Email service temporarily unavailable. Use this OTP: " + otpCode,
        otp: otpCode, // Only for development/testing
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const otpCode = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = { code: otpCode, expiresAt: otpExpires };
    await user.save();

    // Try to send OTP email, but don't fail if SMTP is blocked
    try {
      await sendOtpEmail(email, otpCode);
      return res
        .status(200)
        .json({ success: true, message: "OTP resent to your email" });
    } catch (emailError) {
      console.warn(
        "Email service unavailable, returning OTP in response:",
        emailError.message
      );
      return res.status(200).json({
        success: true,
        message:
          "Email service temporarily unavailable. Use this OTP: " + otpCode,
        otp: otpCode, // Only for development/testing
      });
    }
  } catch (err) {
    console.error("Resend OTP error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ✳️ Password-based Login Controller
export const loginWithPassword = async (req, res) => {
  try {
    console.log("Login with password attempt:", req.body);
    const validated = loginWithPasswordSchema.parse(req.body);
    const { email, password } = validated;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please sign up first.",
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account not verified. Please verify your email first.",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Password not set. Please login with Google or reset your password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Password login error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Invalid credentials",
    });
  }
};

// controllers/authController.js

import {
  verifyGoogleToken,
  verifyGoogleAccessToken,
} from "../utils/googleAuth.js"; // helper we built earlier

// 🎯 Google Login Controller
export const googleLogin = async (req, res) => {
  try {
    const { token, accessToken } = req.body;

    if (!token && !accessToken) {
      return res
        .status(400)
        .json({ success: false, message: "Google token missing" });
    }

    let googleUser;

    // Handle both ID token and access token
    if (accessToken) {
      // Frontend sends access token
      googleUser = await verifyGoogleAccessToken(accessToken);
    } else {
      // Backend expects ID token
      googleUser = await verifyGoogleToken(token);
    }

    if (!googleUser?.email) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Google login" });
    }

    // ✅ Find or create user
    let user = await User.findOne({ email: googleUser.email });
    if (!user) {
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        profilePicture: googleUser.profilePicture,
        role: "user",
      });
    }

    // ✅ Sign JWT using central helper (validates JWT_SECRET)
    const jwtToken = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Google login error:", error.message);
    const status =
      error.message?.includes("JWT_SECRET") ||
      error.message?.includes("Google OAuth not configured")
        ? 400
        : 500;
    return res.status(status).json({
      success: false,
      message: status === 400 ? error.message : "Google login failed",
    });
  }
};
