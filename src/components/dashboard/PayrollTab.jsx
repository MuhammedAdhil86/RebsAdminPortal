import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
// import { getPayrollSettings } from "../../services/PayrollService"; // <- plug in your API

const COLUMNS = ["Pay Cycle", "Pay Day", "Salary Components", "Status"];

const isAbort = (err) =>
  err?.name === "CanceledError" ||
  err?.name === "AbortError" ||
  err?.code === "ERR_CANCELED" ||
  err?.message === "canceled";

export default function PayrollTab({ companyId, companyName }) {
  const [state, setState] = useState({ loading: true, error: null, cycles: [] });
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (companyId == null) return undefined;
    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        // const res = await getPayrollSettings(companyId, { signal });
        // const body = res?.data ?? res;
        // const cycles = Array.isArray(body?.cycles) ? body.cycles : [];
        const cycles = []; // TODO: replace with API result above
        setState({ loading: false, error: null, cycles });
      } catch (err) {
        if (signal.aborted || isAbort(err)) return;
        console.error("[PayrollTab] load failed", err);
        setState({
          loading: false,
          error:
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load payroll settings.",
          cycles: [],
        });
      }
    };

    load();
    return () => controller.abort();
  }, [companyId, reloadKey]);

  const { loading, error, cycles } = state;

  return (
    <div className="flex flex-col gap-3 font-[Poppins]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-500">
          Payroll configuration for {companyName || "this company"}
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-black text-white hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Icon icon="heroicons:plus-20-solid" className="w-4 h-4" />
            Add Pay Cycle
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2" role="status" aria-live="polite">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 rounded bg-gray-100 animate-pulse" />
          ))}
          <span className="sr-only">Loading payroll settings</span>
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

      {!loading && !error && cycles.length === 0 && (
        <p className="text-xs text-gray-500">No payroll settings found.</p>
      )}

      {!loading && !error && cycles.length > 0 && (
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
              {cycles.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="py-2.5 pr-4 font-medium text-gray-900 whitespace-nowrap">
                    {c.name || "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">{c.pay_day || "—"}</td>
                  <td className="py-2.5 pr-4 text-gray-600">
                    {Array.isArray(c.components) && c.components.length
                      ? c.components.join(", ")
                      : "—"}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`px-3 py-1 rounded-full text-[12px] font-medium capitalize ${
                        c.status === "ACTIVE"
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {(c.status || "—").toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
