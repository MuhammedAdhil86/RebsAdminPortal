import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { getLeavePolicies } from "../../services/PolicyService"; // adjust path if needed
import AllocateLeavePolicyModal from "../modals/AllocateLeavePolicy"; // adjust path if needed

const COLUMNS = [
  "Leave Type",
  "Code",
  "Accrual",
  "Days / Year",
  "Carry Forward",
  "Paid / Unpaid",
  "Status",
];

const isAbort = (err) =>
  err?.name === "CanceledError" ||
  err?.name === "AbortError" ||
  err?.code === "ERR_CANCELED" ||
  err?.message === "canceled";

export default function LeaveTab({ companyId, companyName }) {
  const [isAllocating, setIsAllocating] = useState(false);
  const [state, setState] = useState({
    loading: true,
    error: null,
    policies: [],
  });
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (companyId == null) return undefined;
    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await getLeavePolicies(companyId, { signal });
        const body = res?.data ?? res;
        if (body?.success === false) {
          throw new Error(body?.message || "Failed to load leave policies.");
        }
        const policies = Array.isArray(body?.policies) ? body.policies : [];
        setState({ loading: false, error: null, policies });
      } catch (err) {
        if (signal.aborted || isAbort(err)) return;
        console.error("[LeaveTab] load failed", {
          message: err?.message,
          status: err?.status ?? err?.response?.status,
          data: err?.data ?? err?.response?.data,
        });
        setState({
          loading: false,
          error:
            err?.data?.message ||
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load leave policies.",
          policies: [],
        });
      }
    };

    load();
    return () => controller.abort();
  }, [companyId, reloadKey]);

  const { loading, error, policies } = state;

  return (
    <div className="flex flex-col gap-3 font-[Poppins]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-500">
          Leave policies configured for {companyName || "this company"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reload}
            title="Refresh"
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 transition-colors shadow-sm"
          >
            <Icon
              icon="mdi:refresh"
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            type="button"
            onClick={() => setIsAllocating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-black text-white hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Icon icon="heroicons:plus-20-solid" className="w-4 h-4" />
            Allocate Leave
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2" role="status" aria-live="polite">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 rounded bg-gray-100 animate-pulse" />
          ))}
          <span className="sr-only">Loading leave policies</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center justify-between gap-3" role="alert">
          <p className="text-xs text-red-600">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="px-3 py-1.5 text-xs border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 shadow-sm"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && policies.length === 0 && (
        <p className="text-xs text-gray-500">No leave policies found.</p>
      )}

      {!loading && !error && policies.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] text-gray-500 border-b border-gray-100">
                {COLUMNS.map((label) => (
                  <th key={label} scope="col" className="py-2 pr-4 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-gray-200"
                        style={{ backgroundColor: p.color || "#9ca3af" }}
                      />
                      <span className="font-medium text-gray-900 whitespace-nowrap">
                        {p.name || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">{p.code || "—"}</td>
                  <td className="py-2.5 pr-4 text-gray-600 capitalize">
                    {p.accrual_method || "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">
                    {p.employee_accrues ?? "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">
                    {p.carry_forward ? "Yes" : "No"}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[12px] font-medium ${
                        String(p.leave_type).toLowerCase() === "paid"
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.leave_type || "—"}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`px-3 py-1 rounded-full text-[12px] font-medium capitalize ${
                        p.status === "active"
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.status || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Allocate staff modal (shows its own leave-policy dropdown) */}
      <AllocateLeavePolicyModal
        open={isAllocating}
        onClose={() => setIsAllocating(false)}
        onSuccess={reload}
        companyId={companyId}
      />
    </div>
  );
}
