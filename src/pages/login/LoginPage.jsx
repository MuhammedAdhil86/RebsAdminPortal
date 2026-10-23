import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { LOGO_URL } from "../../services/AssetService";
import { loginCompany, forgotPassword } from "../../services/AuthService";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = form.username.trim();
    if (!trimmedEmail || !form.password) {
      setError("Please enter your employee ID / email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Real API call to /platform/company/login via Cloudflare / Production
      await loginCompany({
        email: trimmedEmail,
        password: form.password,
      });

      toast.success("Login successful");

      // Redirect immediately to dashboard on successful login
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(
        err.message ||
          "Invalid credentials or server connection failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setGoogleLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log("Google login clicked");
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Triggers POST /tenant/password/forgot (email is fixed in AuthService)
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    try {
      setError("");
      await forgotPassword();
      toast.success("Password reset email has been sent.");
    } catch (err) {
      toast.error(
        err.message || "Could not send reset email. Please try again.",
      );
    }
  };

  const inputClass =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-brand focus:ring-4 focus:ring-brand/20";

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Left branding panel (hidden on mobile) */}
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-gray-200 via-gray-300 to-brand p-12 lg:flex">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="REBS logo" className="h-5 w-auto" />
        </div>

        <div className="mt-12">
          <h2 className="text-4xl font-bold leading-tight">
            Manage your clients,
            <br />
            simply and smartly.
          </h2>
          <p className="mt-4 max-w-md">
            Track client activity, requests, billing and records in one secure
            admin place.
          </p>
        </div>

        <p className="text-sm text-black">
          © {new Date().getFullYear()} REBS. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-lg"
        >
          {/* Logo for mobile */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img src={LOGO_URL} alt="REBS logo" className="h-12 w-auto" />
          </div>

          <h1 className="text-2xl font-semibold text-ink">Welcome back</h1>
          <p className="mb-6 mt-1 text-sm text-muted">
            Sign in to your account
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand-hover">
              {error}
            </div>
          )}

          <label
            htmlFor="username"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Email
          </label>
          <input
            id="username"
            name="username"
            type="email"
            autoComplete="username"
            placeholder="name@company.com"
            value={form.username}
            onChange={handleChange}
            className={`${inputClass} mb-4`}
          />

          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Password
          </label>
          <div className="relative mb-4">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className={`${inputClass} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-brand hover:text-brand-hover"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="mb-6 flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-ink">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="h-4 w-4 cursor-pointer accent-black"
              />
              Remember me
            </label>
            <a
              href="#"
              onClick={handleForgotPassword}
              className="font-medium text-brand hover:text-brand-hover"
            >
              Forgot password?
            </a>
          </div>

          {/* Login button */}
          {/* Login button */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full rounded-lg bg-gradient-to-br from-gray-200 from-0% via-gray-300 via-5% to-brand to-30% py-2.5 font-semibold text-white shadow-sm transition hover:to-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="h-px flex-1 bg-line" />
          </div>
        </form>
      </div>
    </div>
  );
}
