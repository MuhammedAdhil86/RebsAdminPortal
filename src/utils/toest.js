import { toast } from "react-toastify";

// Pulls a readable message out of any backend/axios error shape
export const getErrorMessage = (error, fallback = "Something went wrong") => {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) return data;

  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  // FastAPI-style validation errors: [{ loc, msg, type }]
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => d?.msg).filter(Boolean).join(", ");
  }

  return (
    data?.message ||
    data?.error ||
    (error?.code === "ERR_NETWORK" ? "Network error. Check your connection." : null) ||
    error?.message ||
    fallback
  );
};

export const showSuccess = (msg) => msg && toast.success(msg, { toastId: msg });
export const showError = (msg) => msg && toast.error(msg, { toastId: msg });
export const showInfo = (msg) => msg && toast.info(msg, { toastId: msg });
export const showWarning = (msg) => msg && toast.warning(msg, { toastId: msg });