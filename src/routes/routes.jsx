// src/routes/routes.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";

// Eagerly loaded (needed on first paint)
import LoginPage from "../pages/login/LoginPage";
import ResetPasswordPage from "../pages/login/Resetpassword";
import Subscriptions from "../pages/Subscriptions";

// Layout + error screen
import MainLayout from "../utils/MainLayout"; // <- change to where your layout file is
import RouteError from "../utils/RouteError";

// Route guards (RouteGuards.jsx must only export these two functions)
import { ProtectedRoute, PublicRoute } from "./RouteGuards";

/**
 * Lazy-load a page so each one becomes its own bundle chunk.
 * Requires react-router-dom 6.9+.
 */
const page = (loader) => async () => {
  const mod = await loader();
  return { Component: mod.default };
};

export const router = createBrowserRouter([
  /* PUBLIC ROUTES */
  {
    element: <PublicRoute />,
    errorElement: <RouteError />,
    children: [
      { path: "/", element: <LoginPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
    ],
  },

  /* PROTECTED ROUTES (inside MainLayout: sidebar + header) */
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <MainLayout />,
        errorElement: <RouteError />,
        children: [
          {
            path: "/dashboard",
            lazy: page(() => import("../pages/dashboard/Dashboard")),
            handle: {
              title: "Admin Dashboard",
              subtitle: "Track and manage all details here",
            },
          },
          {
            path: "/configuration",
            lazy: page(() => import("../pages/Configuration")),
            handle: {
              title: "Configuration",
              subtitle: "Manage client companies and organization settings",
            },
          },
          {
            path: "/subscriptions",
            element: <Subscriptions />,
            handle: {
              title: "Subscriptions",
              subtitle: "Track client plans, services and user extensions",
            },
          },
        ],
      },
    ],
  },

  /* FALLBACK */
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default router;
