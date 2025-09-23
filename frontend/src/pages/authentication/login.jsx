import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithPassword, googleLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loginMethod, setLoginMethod] = useState("otp");

  // OTP / Password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (loginMethod === "otp") {
        const res = await login(email);
        setSuccess(res.message || "OTP sent to your email.");
        if (res.otp) toast.info(`Development OTP: ${res.otp}`);
        setTimeout(() => {
          navigate("/otp", { state: { email, fromLogin: true } });
        }, 1500);
      } else {
        const res = await loginWithPassword(email, password);
        if (res.success) {
          toast.success("Login successful!");
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google OAuth Login via Google Identity Services (no redirect_uri needed)
  const handleGoogleLogin = async () => {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) throw new Error("Missing VITE_GOOGLE_CLIENT_ID");

      // Load GIS script if not present
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
              toast.error("Google login cancelled or failed");
              return;
            }
            const res = await googleLogin({ accessToken: resp.access_token });
            if (res.success) {
              toast.success("Google login successful!");
              navigate("/dashboard");
            } else {
              toast.error(res.message || "Google login failed");
            }
          } catch (e) {
            toast.error("Google login failed: " + (e.message || "Error"));
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-yellow-100 to-blue-100 px-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-pink-600 text-center mb-4">
          Welcome Back
        </h2>

        {/* Errors */}
        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-600 p-2 rounded mb-4">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg mb-4">
          <button
            type="button"
            onClick={() => setLoginMethod("otp")}
            className={`flex-1 py-2 rounded-md ${
              loginMethod === "otp" ? "bg-white text-pink-600" : "text-gray-600"
            }`}
          >
            OTP Login
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod("password")}
            className={`flex-1 py-2 rounded-md ${
              loginMethod === "password"
                ? "bg-white text-pink-600"
                : "text-gray-600"
            }`}
          >
            Password
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded p-3"
          />

          {loginMethod === "password" && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border rounded p-3"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-500 text-white py-3 rounded hover:bg-pink-600"
          >
            {loading
              ? "Please wait..."
              : loginMethod === "otp"
              ? "Send OTP"
              : "Login"}
          </button>
        </form>

        {/* ✅ Google OAuth Button */}
        <div className="mt-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-gray-300 py-3 rounded flex items-center justify-center gap-2"
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>
        </div>

        <p className="mt-4 text-center text-gray-600">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-pink-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
