import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/img/rebslogo.png";

const RULES = [
  "At least 8 characters",
  "One uppercase letter",
  "One lowercase letter",
  "One number",
  "One special character",
];

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:border-brand focus:ring-4 focus:ring-brand/20";

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

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <form className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-lg">
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
              placeholder="Enter a new password"
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
              placeholder="Type it again"
              className={`${inputClass} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-brand hover:text-brand-hover"
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>

          {/* Requirements checklist */}
          <ul className="mb-6 space-y-1.5">
            {RULES.map((label) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm text-muted"
              >
                <span className="h-4 w-4 rounded-full border border-line" />
                {label}
              </li>
            ))}
          </ul>

          <button
            type="submit"
            className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-hover"
          >
            Reset password
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
      </div>
    </div>
  );
}
