import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import {
  getShiftAllocations,
  getStaffList,
  isCanceled,
} from "../../services/PolicyService"; // adjust path if needed
import AllocateShiftModal from "../modals/AllocateShiftModal"; // adjust path if needed

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Static class strings so Tailwind can detect them
const SHIFT_COLORS = [
  { chip: "bg-blue-50 text-blue-800", dot: "bg-blue-500" },
  { chip: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  { chip: "bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  { chip: "bg-purple-50 text-purple-800", dot: "bg-purple-500" },
  { chip: "bg-rose-50 text-rose-800", dot: "bg-rose-500" },
  { chip: "bg-cyan-50 text-cyan-800", dot: "bg-cyan-500" },
  { chip: "bg-orange-50 text-orange-800", dot: "bg-orange-500" },
  { chip: "bg-indigo-50 text-indigo-800", dot: "bg-indigo-500" },
];

const errorMessage = (err, fallback) =>
  err?.data?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;

const pad = (n) => String(n).padStart(2, "0");

// "YYYY-MM" for the current month (default for the month picker)
const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

// "YYYY-MM-DD" for today (local)
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Move a "YYYY-MM" string by +/- N months
const shiftMonth = (ym, delta) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

// Stable colour per shift name
const colorForShift = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return SHIFT_COLORS[hash % SHIFT_COLORS.length];
};

// Build a Sunday-first grid of cells (null = padding) for a "YYYY-MM" month
const buildMonthGrid = (ym) => {
  const [y, m] = String(ym).split("-").map(Number);
  if (!y || !m) return [];
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({
      day: d,
      key: `${y}-${pad(m)}-${pad(d)}`,
      weekday: new Date(y, m - 1, d).getDay(),
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

function StatPill({ icon, label, value, tone = "text-gray-700" }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <Icon icon={icon} className={`w-4 h-4 ${tone}`} />
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function CalendarView({ month, rows, staffName, onPrev, onNext, onToday }) {
  const cells = useMemo(() => buildMonthGrid(month), [month]);
  const today = todayKey();

  const [mYear, mNum] = month.split("-").map(Number);
  const monthLabel =
    mYear && mNum ? `${MONTHS_LONG[mNum - 1]} ${mYear}` : "Select month";

  // date (YYYY-MM-DD) -> allocation row
  const byDate = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const key = String(r.date || "").slice(0, 10);
      if (key) map.set(key, r);
    });
    return map;
  }, [rows]);

  // Summary + legend
  const { allocated, crossCount, defaultCount, unallocated, legend } =
    useMemo(() => {
      const names = new Set();
      let allocatedN = 0;
      let cross = 0;
      let def = 0;
      let none = 0;
      rows.forEach((r) => {
        if (r.shift_name) {
          names.add(r.shift_name);
          allocatedN += 1;
        } else {
          none += 1;
        }
        if (r.is_cross_shift) cross += 1;
        if (r.is_default) def += 1;
      });
      return {
        allocated: allocatedN,
        crossCount: cross,
        defaultCount: def,
        unallocated: none,
        legend: [...names],
      };
    }, [rows]);

  return (
    <div className="flex flex-col gap-3">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatPill
          icon="mdi:calendar-check-outline"
          label="Allocated"
          value={allocated}
        />
        <StatPill
          icon="mdi:star-outline"
          label="Default"
          value={defaultCount}
        />
        <StatPill
          icon="mdi:swap-horizontal"
          label="Cross shift"
          value={crossCount}
        />
        <StatPill
          icon="mdi:calendar-remove-outline"
          label="Not allocated"
          value={unallocated}
          tone="text-gray-400"
        />
      </div>

      {/* Calendar card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Card header: month title + navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 leading-tight">
              {monthLabel}
            </h3>
            {staffName && (
              <p className="text-[11px] text-gray-500 truncate">{staffName}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToday}
              className="px-3 py-1.5 text-xs border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 shadow-sm transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous month"
              className="p-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 shadow-sm transition-colors"
            >
              <Icon icon="mdi:chevron-left" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Next month"
              className="p-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 shadow-sm transition-colors"
            >
              <Icon icon="mdi:chevron-right" className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            {/* Weekday header */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/70">
              {WEEKDAYS.map((w, i) => (
                <div
                  key={w}
                  className={`py-2 text-center text-[10px] font-medium uppercase tracking-wider ${
                    i === 0 || i === 6 ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Day grid (gap-px over a gray bg draws the grid lines) */}
            <div className="grid grid-cols-7 gap-px bg-gray-100">
              {cells.map((cell, idx) => {
                if (!cell) {
                  return (
                    <div
                      key={`pad-${idx}`}
                      className="min-h-[96px] bg-gray-50/60"
                    />
                  );
                }
                const row = byDate.get(cell.key);
                const isToday = cell.key === today;
                const isWeekend = cell.weekday === 0 || cell.weekday === 6;
                const color = row?.shift_name
                  ? colorForShift(row.shift_name)
                  : null;

                return (
                  <div
                    key={cell.key}
                    className={`relative min-h-[96px] p-2 flex flex-col gap-1.5 transition-colors hover:bg-gray-50 ${
                      isWeekend ? "bg-gray-50/40" : "bg-white"
                    } ${isToday ? "ring-1 ring-inset ring-black z-10" : ""}`}
                  >
                    <span
                      className={`inline-flex items-center justify-center self-start text-[11px] font-medium w-6 h-6 rounded-full ${
                        isToday
                          ? "bg-black text-white"
                          : isWeekend
                            ? "text-gray-400"
                            : "text-gray-700"
                      }`}
                    >
                      {cell.day}
                    </span>

                    {row && (
                      <>
                        {color ? (
                          <div
                            title={row.shift_name}
                            className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-medium ${color.chip}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${color.dot}`}
                            />
                            <span className="truncate">{row.shift_name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-md border border-dashed border-gray-200 px-1.5 py-1 text-[11px] text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-300" />
                            <span className="truncate">Not allocated</span>
                          </div>
                        )}

                        {(row.is_default || row.is_cross_shift) && (
                          <div className="flex flex-wrap gap-1">
                            {row.is_default && (
                              <span className="px-1.5 py-0.5 rounded-full border border-gray-200 bg-white text-gray-600 text-[9px] font-medium">
                                Default
                              </span>
                            )}
                            {row.is_cross_shift && (
                              <span className="px-1.5 py-0.5 rounded-full bg-black text-white text-[9px] font-medium">
                                Cross
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        {legend.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            {legend.map((name) => (
              <span
                key={name}
                className="flex items-center gap-1.5 text-[11px] text-gray-600"
              >
                <span
                  className={`w-2 h-2 rounded-full ${colorForShift(name).dot}`}
                />
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <div className="h-14 border-b border-gray-100 flex items-center px-4">
        <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-100">
        {[...Array(35)].map((_, i) => (
          <div key={i} className="min-h-[96px] bg-white p-2">
            <div className="h-6 w-6 rounded-full bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading shift allocations</span>
    </div>
  );
}

export default function ShiftTab({ companyId, companyName }) {
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  /* ---------------- Staff list ---------------- */
  const [staff, setStaff] = useState({
    loading: true,
    error: null,
    users: [],
  });
  const [selectedUserId, setSelectedUserId] = useState("");
  const [allocateOpen, setAllocateOpen] = useState(false);

  /* ---------------- Shift allocations (per staff, per month) ---------------- */
  const [month, setMonth] = useState(currentMonth);
  const [alloc, setAlloc] = useState({
    loading: false,
    error: null,
    rows: [],
  });

  // Load staff list
  useEffect(() => {
    if (companyId == null) return undefined;
    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      setStaff((s) => ({ ...s, loading: true, error: null }));
      try {
        const { users } = await getStaffList(companyId, { signal });
        setStaff({ loading: false, error: null, users });
        // Default to the first staff member; keep the current one if still valid
        setSelectedUserId((cur) =>
          users.some((u) => String(u.uuid) === String(cur))
            ? cur
            : users[0]?.uuid != null
              ? String(users[0].uuid)
              : "",
        );
      } catch (err) {
        if (signal.aborted || isCanceled(err)) return;
        console.error("[ShiftTab] staff load failed", err);
        setStaff({
          loading: false,
          error: errorMessage(err, "Failed to load staff."),
          users: [],
        });
      }
    };

    load();
    return () => controller.abort();
  }, [companyId, reloadKey]);

  // Load shift allocations for the selected staff + month
  useEffect(() => {
    if (companyId == null || !selectedUserId || !month) return undefined;
    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      setAlloc((s) => ({ ...s, loading: true, error: null }));
      try {
        const body = await getShiftAllocations(
          { companyId, userId: selectedUserId, month },
          { signal },
        );
        if (body?.success === false) {
          throw new Error(body?.message || "Failed to load allocations.");
        }
        const rows = Array.isArray(body?.shifts) ? body.shifts : [];
        setAlloc({ loading: false, error: null, rows });
      } catch (err) {
        if (signal.aborted || isCanceled(err)) return;
        console.error("[ShiftTab] allocations load failed", err);
        setAlloc({
          loading: false,
          error: errorMessage(err, "Failed to load shift allocations."),
          rows: [],
        });
      }
    };

    load();
    return () => controller.abort();
  }, [companyId, selectedUserId, month, reloadKey]);

  const busy = staff.loading || alloc.loading;

  const selectedStaff = staff.users.find(
    (u) => String(u.uuid) === String(selectedUserId),
  );
  const staffName = selectedStaff
    ? `${selectedStaff.name}${
        selectedStaff.designation ? ` – ${selectedStaff.designation}` : ""
      }`
    : "";

  return (
    <div className="flex flex-col gap-3 font-[Poppins]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-gray-500">
          Shift allocations for {companyName || "this company"}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={staff.loading || staff.users.length === 0}
            aria-label="Select staff"
            className="border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-black disabled:bg-gray-50 disabled:text-gray-400"
          >
            {staff.loading && <option value="">Loading staff...</option>}
            {!staff.loading && staff.users.length === 0 && (
              <option value="">No staff</option>
            )}
            {staff.users.map((u) => (
              <option key={u.uuid} value={String(u.uuid)}>
                {u.name}
                {u.designation ? ` – ${u.designation}` : ""}
              </option>
            ))}
          </select>

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Select month"
            className="border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-black"
          />

          <button
            type="button"
            onClick={() => setAllocateOpen(true)}
            disabled={!selectedUserId}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-black text-white hover:bg-gray-800 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="mdi:calendar-plus" className="w-4 h-4" />
            Allocate shift
          </button>

          <button
            type="button"
            onClick={reload}
            title="Refresh"
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 transition-colors shadow-sm"
          >
            <Icon
              icon="mdi:refresh"
              className={`w-4 h-4 ${busy ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {staff.error && (
        <div className="flex items-center justify-between gap-3" role="alert">
          <p className="text-xs text-red-600">{staff.error}</p>
          <button
            type="button"
            onClick={reload}
            className="px-3 py-1.5 text-xs border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 shadow-sm"
          >
            Retry
          </button>
        </div>
      )}

      {alloc.loading && <CalendarSkeleton />}

      {!alloc.loading && alloc.error && (
        <div className="flex items-center justify-between gap-3" role="alert">
          <p className="text-xs text-red-600">{alloc.error}</p>
          <button
            type="button"
            onClick={reload}
            className="px-3 py-1.5 text-xs border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-700 shadow-sm"
          >
            Retry
          </button>
        </div>
      )}

      {!alloc.loading &&
        !alloc.error &&
        selectedUserId &&
        alloc.rows.length === 0 && (
          <p className="text-xs text-gray-500">
            No shift allocations for this month.
          </p>
        )}

      {!alloc.loading && !alloc.error && alloc.rows.length > 0 && (
        <CalendarView
          month={month}
          rows={alloc.rows}
          staffName={staffName}
          onPrev={() => setMonth((m) => shiftMonth(m, -1))}
          onNext={() => setMonth((m) => shiftMonth(m, 1))}
          onToday={() => setMonth(currentMonth())}
        />
      )}

      <AllocateShiftModal
        open={allocateOpen}
        onClose={() => setAllocateOpen(false)}
        companyId={companyId}
        staffId={selectedUserId}
        staffName={staffName}
        onSuccess={({ fromDate }) => {
          // Jump to the allocated month so the new shifts are visible
          const target = String(fromDate).slice(0, 7);
          if (target && target !== month) setMonth(target);
          else reload();
        }}
      />
    </div>
  );
}
