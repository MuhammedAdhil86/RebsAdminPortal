import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "@/assets/img/rebslogo.png";
import { resetPassword } from "../../services/AuthService";

const RULES = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // From the email link: /tenant/password/reset/?token=XXXX
  const token = searchParams.get("token")?.trim() || null;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const results = useMemo(
    () => RULES.map((r) => ({ label: r.label, met: r.test(password) })),
    [password],
  );
  const allMet = results.every((r) => r.met);
  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!allMet) {
      setError("Your password needs to meet every requirement below.");
      return;
    }
    if (password !== confirm) {
      setError("Both passwords need to match.");
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ token, new_password: password });
      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setError(
        err.message ||
          "We couldn't reset your password. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-brand focus:ring-4 focus:ring-brand/20";

  const primaryBtn =
    "block w-full rounded-lg bg-brand py-2.5 text-center font-semibold text-white transition hover:bg-brand-hover";

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Left branding panel (hidden on mobile) */}
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-gray-200 via-gray-300 to-brand p-12 lg:flex">
        <div className="flex items-center gap-3">
          <img src={logo} alt="REBS logo" className="h-12 w-auto" />
          <span className="font-brand text-3xl font-normal tracking-[0.15em] text-black">
            REBS
          </span>
        </div>

        <div className="mt-12">
          <h2 className="text-4xl font-bold leading-tight">
            This link is yours alone,
            <br />
            and it works once.
          </h2>
          <p className="mt-4 max-w-md">
            Set a new password below. The link expires as soon as you&apos;re
            done.
          </p>
          <p className="mt-6 max-w-md text-sm">
            Trouble with the link? Go back to the login page and request a fresh
            one.
          </p>
        </div>

        <p className="text-sm text-black">
          © {new Date().getFullYear()} REBS. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        {/* ───────── Token missing ───────── */}
        {!token ? (
          <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-lg">
            {/* Logo for mobile */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <img src={logo} alt="REBS logo" className="h-12 w-auto" />
              <span className="font-brand text-2xl font-normal tracking-[0.15em] text-black">
                REBS
              </span>
            </div>

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 8v5M12 16h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>

            <h1 className="text-2xl font-semibold text-ink">
              This link is missing its key
            </h1>
            <p className="mb-6 mt-2 text-sm leading-relaxed text-muted">
              The reset link looks incomplete or has already been used. Request
              a new one from the login page.
            </p>

            <Link to="/login" className={primaryBtn}>
              Back to login
            </Link>
          </div>
        ) : success ? (
          /* ───────── Success ───────── */
          <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-lg">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 12l6 6L20 6" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-ink">Password reset</h1>
            <p className="mb-6 mt-2 text-sm leading-relaxed text-muted">
              Your new password is live. Redirecting you to login...
            </p>
            <Link to="/login" className={primaryBtn}>
              Go to login
            </Link>
          </div>
        ) : (
          /* ───────── Token present: your existing form ───────── */
          <form
            onSubmit={handleSubmit}
            noValidate
            className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-lg"
          >
            {/* Logo for mobile */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <img src={logo} alt="REBS logo" className="h-12 w-auto" />
              <span className="font-brand text-2xl font-normal tracking-[0.15em] text-black">
                REBS
              </span>
            </div>

            <h1 className="text-2xl font-semibold text-ink">
              Choose a new password
            </h1>
            <p className="mb-6 mt-1 text-sm text-muted">
              Make it something only you&apos;d guess.
            </p>

            {error && (
              <div className="mb-4 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-brand-hover">
                {error}
              </div>
            )}

            {/* New password */}
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              New password
            </label>
            <div className="relative mb-4">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter a new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
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

            {/* Confirm password */}
            <label
              htmlFor="confirm"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Confirm password
            </label>
            <div className="relative mb-4">
              <input
                id="confirm"
                name="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Type it again"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError("");
                }}
                className={`${inputClass} pr-16 ${mismatch ? "border-brand" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-brand hover:text-brand-hover"
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
            {mismatch && (
              <p className="-mt-2 mb-4 text-xs text-brand-hover">
                Doesn&apos;t match yet
              </p>
            )}

            {/* Requirements checklist */}
            <ul className="mb-6 space-y-1.5">
              {results.map(({ label, met }) => (
                <li
                  key={label}
                  className={`flex items-center gap-2 text-sm ${
                    met ? "text-ink" : "text-muted"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      met ? "border-brand bg-brand" : "border-line"
                    }`}
                  >
                    {met && (
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M2 6l3 3 5-6"
                          stroke="#fff"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {label}
                </li>
              ))}
            </ul>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>

            <p className="mt-5 text-center text-sm text-muted">
              <Link
                to="/login"
                className="font-medium text-brand hover:text-brand-hover"
              >
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
