import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { getActiveTenants } from "../../services/SubscriptionService"; // <- adjust path
import { getemployeeUsers } from "../../services/PolicyService"; // <- adjust path
import ShiftTab from "../dashboard/ShiftTab"; // adjust path if needed
import LeaveTab from "../dashboard/LeaveTab"; // adjust path if needed
// import PayrollTab from "../dashboard/PayrollTab"; // adjust path if needed
import AddEmployeeTab from "../dashboard/AddEmployeeTab"; // adjust path if needed

const unwrap = (res) => res?.data ?? res;

const isAbort = (err) =>
  err?.name === "CanceledError" ||
  err?.name === "AbortError" ||
  err?.code === "ERR_CANCELED" ||
  err?.message === "canceled";

const clean = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();

const initials = (name) =>
  clean(name)
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const COLUMNS = ["Employee", "Department", "Designation", "Branch"];

const SECTIONS = [
  { key: "shift", label: "Shift", icon: "mdi:clock-outline" },
  { key: "leave", label: "Leave", icon: "mdi:calendar-check-outline" },
  // { key: "payroll", label: "Payroll", icon: "mdi:cash-multiple" },
  {
    key: "addEmployee",
    label: "Add Employee",
    icon: "mdi:account-plus-outline",
  },
];

/* Default content for each button (separate files).
   Can still be overridden through the `panels` prop.
   Each function receives { companyId, companyName, onSaved }.
   `onSaved` reloads the employee list and returns to the Employees table. */
const DEFAULT_PANELS = {
  shift: ({ companyId, companyName }) => (
    <ShiftTab companyId={companyId} companyName={companyName} />
  ),
  leave: ({ companyId, companyName }) => (
    <LeaveTab companyId={companyId} companyName={companyName} />
  ),
  payroll: ({ companyId, companyName }) => (
    <PayrollTab companyId={companyId} companyName={companyName} />
  ),
  addEmployee: ({ companyId, companyName, onSaved }) => (
    <AddEmployeeTab
      companyId={companyId}
      companyName={companyName}
      onSaved={onSaved}
    />
  ),
};

/* props:
     companyId   – optional; when omitted, the active tenant's id is used
     companyName – optional; shown in the title (falls back to the tenant name)
     onBack      – optional; shows a back button when provided
     panels      – optional; override content for each button, e.g.
                   { shift: <MyShift />, leave: ({ companyId }) => <MyLeave companyId={companyId} /> }
                   (a function receives { companyId, companyName, onSaved }) */
export default function CompanyDetailsView({
  companyId,
  companyName,
  onBack,
  panels = DEFAULT_PANELS,
}) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    tenant: null,
    resolvedId: null,
    users: [],
    total: 0,
  });
  const [activeSection, setActiveSection] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        let tenant = null;
        let id = companyId;

        // No hardcoded id: use the prop, otherwise the first active tenant
        if (id == null) {
          const res = unwrap(await getActiveTenants({ signal }));
          const list = Array.isArray(res) ? res : (res?.data ?? []);
          tenant = list[0] ?? null;
          id = tenant?.company_id;
          if (id == null) throw new Error("No active tenant found.");
        }

        const body = unwrap(await getemployeeUsers(id, { signal }));
        if (body?.success === false) {
          throw new Error(body?.message || "Failed to load employees.");
        }
        const users = Array.isArray(body?.users) ? body.users : [];

        setState({
          loading: false,
          error: null,
          tenant,
          resolvedId: id,
          users,
          total: body?.total ?? users.length,
        });
      } catch (err) {
        if (signal.aborted || isAbort(err)) return;
        console.error("[CompanyDetailsView] list-users failed", {
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
            "Failed to load employees.",
          tenant: null,
          resolvedId: null,
          users: [],
          total: 0,
        });
      }
    };

    load();
    return () => controller.abort();
  }, [companyId, reloadKey]);

  const { loading, error, tenant, resolvedId, users, total } = state;
  const title = companyName || tenant?.company_name;
  const effectiveId = companyId ?? resolvedId;

  const activeLabel = SECTIONS.find((x) => x.key === activeSection)?.label;

  const toggleSection = (key) =>
    setActiveSection((cur) => (cur === key ? null : key));

  const renderPanel = () => {
    if (!activeSection) return null;
    const panel = panels[activeSection];
    const label = SECTIONS.find((x) => x.key === activeSection)?.label;
    const content =
      typeof panel === "function"
        ? panel({
            companyId: effectiveId,
            companyName: title,
            onSaved: () => {
              reload(); // refetch the employee table
              setActiveSection(null); // go back to Employees
            },
          })
        : panel;
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{label}</h3>
        {content ?? (
          <p className="text-xs text-gray-500">
            {label} settings for this company will appear here.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 font-[Poppins]">
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 transition-colors shadow-sm"
          >
            <Icon icon="heroicons:arrow-left-20-solid" className="w-4 h-4" />
          </button>
        )}
        <h2 className="text-base font-semibold text-gray-900">
          {title ? `${title} – ` : ""}
          {activeLabel || "Employees"}
        </h2>
        {!loading && !error && (
          <span className="text-[11px] text-gray-500">{total} total</span>
        )}

        <div
          className="ml-auto flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Company sections"
        >
          {SECTIONS.map(({ key, label, icon }) => {
            const active = activeSection === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSection(key)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border shadow-sm transition-colors ${
                  active
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon icon={icon} className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section selected: show only that section's data */}
      {activeSection && renderPanel()}

      {/* No section selected: show the employees table */}
      {!activeSection && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          {loading && (
            <div className="space-y-2" role="status" aria-live="polite">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 rounded bg-gray-100 animate-pulse"
                />
              ))}
              <span className="sr-only">Loading employees</span>
            </div>
          )}

          {!loading && error && (
            <div
              className="flex items-center justify-between gap-3"
              role="alert"
            >
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

          {!loading && !error && users.length === 0 && (
            <p className="text-xs text-gray-500">No employees found.</p>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] text-gray-500 border-b border-gray-100">
                    {COLUMNS.map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="py-2 pr-4 font-medium"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.uuid}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-[10px] font-medium flex items-center justify-center shrink-0">
                            {initials(u.name)}
                          </div>
                          <span className="font-medium text-gray-900 whitespace-nowrap">
                            {clean(u.name)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-600">
                        {clean(u.department) || "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-600">
                        {clean(u.designation) || "—"}
                      </td>
                      <td className="py-2.5 text-gray-600">
                        {clean(u.branch) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
