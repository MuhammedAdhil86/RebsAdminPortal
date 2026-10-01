import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/login/LoginPage";
import ResetPasswordPage from "../pages/login/Resetpassword";
import Dashboard from "../pages/dashboard/Dashboard";
import { ProtectedRoute, PublicRoute } from "../routes/RouteGuards";

export const router = createBrowserRouter([
  // Public-only Routes (Redirect to /dashboard if logged in)
  {
    element: <PublicRoute />,
    children: [
      { path: "/", element: <LoginPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
    ],
  },

  // Protected Routes (Redirect to /login if token is missing)
  {
    element: <ProtectedRoute />,
    children: [{ path: "/dashboard", element: <Dashboard /> }],
  },

  // Catch-all fallback
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

export default router;
