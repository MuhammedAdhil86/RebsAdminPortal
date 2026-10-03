// src/routes/routes.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";

// Eagerly loaded (needed on first paint)
import LoginPage from "../pages/login/LoginPage";
import ResetPasswordPage from "../pages/login/Resetpassword";

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
  /* ---------------------------------------------------------------
   * PUBLIC ROUTES
   * Logged-in users are redirected to /dashboard.
   * --------------------------------------------------------------- */
  {
    element: <PublicRoute />,
    errorElement: <RouteError />,
    children: [
      { path: "/", element: <LoginPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
    ],
  },

  /* ---------------------------------------------------------------
   * PROTECTED ROUTES
   * No token -> /login. Otherwise rendered inside MainLayout
   * (sidebar + header). Header title/subtitle come from `handle`.
   * --------------------------------------------------------------- */
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <MainLayout />,
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

          // ---- Add new pages below (also add `path` in Sidebar.jsx) ----
          // {
          //   path: "/all-clients",
          //   lazy: page(() => import("../pages/AllClients")),
          //   handle: { title: "All Clients", subtitle: "View and manage every client" },
          // },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------
   * FALLBACK
   * Unknown URLs go to /login (a logged-in user is then sent on to
   * /dashboard by PublicRoute).
   * --------------------------------------------------------------- */
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default router;
