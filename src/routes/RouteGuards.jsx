import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/authStore";

// Protects private pages like /dashboard
export function ProtectedRoute() {
  const token = useAuthStore((state) => state.accessToken);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// Prevents authenticated users from seeing Login again
export function PublicRoute() {
  const token = useAuthStore((state) => state.accessToken);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
