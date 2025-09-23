import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";

const Signup = () => {
  const navigate = useNavigate();
  const { signup, googleLogin } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await signup(form);
      setSuccess(res.message || "Signup successful! Check your email for OTP.");

      // Redirect to OTP page after successful signup
      setTimeout(() => {
        navigate("/otp", {
          state: {
            email: form.email,
            fromSignup: true,
          },
        });
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google OAuth Signup/Login via Google Identity Services
  const handleGoogleSignup = async () => {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) throw new Error("Missing VITE_GOOGLE_CLIENT_ID");

      const ensureGsi = () =>
        new Promise((resolve, reject) => {
          if (window.google && window.google.accounts) return resolve();
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error("Failed to load Google script"));
          document.head.appendChild(script);
        });

      await ensureGsi();

      const scope =
        "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope,
        prompt: "consent",
        callback: async (resp) => {
          try {
            if (!resp || !resp.access_token) {
              toast.error("Google signup/login cancelled or failed");
              return;
            }
            const res = await googleLogin({ accessToken: resp.access_token });
            if (res.success) {
              toast.success("Google signup/login successful!");
              navigate("/dashboard");
            } else {
              toast.error(res.message || "Google signup failed");
            }
          } catch (e) {
            toast.error("Google signup failed: " + (e.message || "Error"));
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (err) {
      setError(err.message || "Google OAuth failed");
      toast.error(err.message || "Google OAuth failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-yellow-100 to-blue-100 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-lg w-full max-w-sm sm:max-w-md lg:max-w-lg">
        {/* Logo and Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-xl shadow-lg flex items-center justify-center">
              <span className="text-white text-sm sm:text-lg font-bold">C</span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600">
              Creatistick
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pink-600">
            Create Account
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mt-2">
            Join us and start collecting amazing stickers!
          </p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              {success}
            </div>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 sm:py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 sm:py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email address"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 sm:py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-3 sm:py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 6 characters long
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-yellow-500 text-white py-3 sm:py-3.5 rounded-lg font-semibold hover:from-pink-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating Account...
              </div>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* ✅ Google OAuth Button */}
        <div className="mb-6">
          <button
            onClick={handleGoogleSignup}
            className="w-full bg-white border border-gray-300 py-3 sm:py-3.5 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-all duration-200 text-sm sm:text-base"
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="font-medium">Continue with Google</span>
          </button>
        </div>

        {/* Login Link */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-pink-600 font-semibold hover:text-pink-700 transition-colors duration-200 underline decoration-2 underline-offset-2"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Terms and Privacy */}
        <div className="mt-6 sm:mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs sm:text-sm text-gray-500 text-center">
            By creating an account, you agree to our{" "}
            <Link
              to="/terms"
              className="text-pink-600 hover:text-pink-700 underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="text-pink-600 hover:text-pink-700 underline"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
