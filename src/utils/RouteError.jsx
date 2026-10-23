import React from "react";
import { isRouteErrorResponse, useRouteError, Link } from "react-router-dom";

/** Shown when a route throws or a lazy chunk fails to load. */
export default function RouteError() {
  const error = useRouteError();

  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const heading = is404 ? "Page not found" : "Something went wrong";
  const message = is404
    ? "The page you are looking for does not exist."
    : "An unexpected error occurred. Please try again.";

  if (import.meta.env?.DEV) console.error(error);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-white">
      <h1 className="text-2xl text-gray-900">{heading}</h1>
      <p className="text-sm text-gray-500 max-w-md">{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          Reload
        </button>
        <Link
          to="/dashboard"
          className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
