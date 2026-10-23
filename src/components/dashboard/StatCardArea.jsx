import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import {
  initials,
  COMPANY_ONBOARDING,
  USER_ONBOARDING,
} from "./CompaniesTab"; // adjust path if needed
import { getEnquiries } from "../../services/Enquiries"; // adjust path if needed

/** KPI cards + slide-in detail panel. Fetches its own data. */
export default function StatCardArea() {
  const safeCompanies = Array.isArray(COMPANY_ONBOARDING) ? COMPANY_ONBOARDING : [];
  const safeUsers = Array.isArray(USER_ONBOARDING) ? USER_ONBOARDING : [];

  const [enquiries, setEnquiries] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getEnquiries();
        const list = Array.isArray(res) ? res : res?.items || [];
        if (!cancelled) setEnquiries(list);
      } catch {
        if (!cancelled) setEnquiries([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const newEnquiries = enquiries.filter((e) => !e.is_paid);

  const serviceCounts = {};
  enquiries.forEach((e) =>
    (e.services || []).forEach((s) => {
      serviceCounts[s.name] = (serviceCounts[s.name] || 0) + 1;
    }),
  );
  const serviceItems = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      sub: `${count} ${count === 1 ? "enquiry" : "enquiries"}`,
    }));

  const dashboardData = {
    total_companies: {
      count: safeCompanies.length,
      items: safeCompanies.map((c) => ({ name: c.company, sub: `${c.plan} plan` })),
    },
    onboarding: {
      count: safeCompanies.filter((c) => c.status === "In Progress").length,
      items: safeCompanies
        .filter((c) => c.status === "In Progress")
        .map((c) => ({ name: c.company, sub: `${c.stage} · ${c.progress}%` })),
    },
    total_users: {
      count: safeUsers.length,
      items: safeUsers.map((u) => ({ name: u.name, sub: u.company })),
    },
    new_enquiries: {
      count: newEnquiries.length,
      items: newEnquiries.map((e) => ({
        name: e.name,
        sub:
          (e.services || []).map((s) => s.name).join(", ") ||
          e.organisation_type ||
          "-",
      })),
    },
    enquiry_services: { count: serviceItems.length, items: serviceItems },
    pending_documents: {
      count: safeCompanies.filter((c) => c.status === "Pending").length,
      items: safeCompanies
        .filter((c) => c.status === "Pending")
        .map((c) => ({ name: c.company, sub: c.stage })),
    },
  };

  const kpiCards = [
    { id: "total_companies", label: "Total Companies", bg: "#EBFDEF", icon: "mdi:office-building-outline" },
    { id: "onboarding", label: "Onboarding", bg: "#E8EFF9", icon: "mdi:progress-clock" },
    { id: "total_users", label: "Total Users", bg: "#FFEFE7", icon: "mdi:account-group-outline" },
    { id: "new_enquiries", label: "New Enquiries", bg: "#FFFBDB", icon: "mdi:message-text-outline" },
    { id: "enquiry_services", label: "Enquiry Services", bg: "#F1E9FF", icon: "mdi:apps" },
    { id: "pending_documents", label: "Pending Documents", bg: "#FFDADA", icon: "mdi:file-clock-outline" },
  ].map((c) => ({ ...c, value: dashboardData[c.id].count, isClickable: true }));

  const items = selectedCategory ? dashboardData[selectedCategory.id]?.items || [] : [];

  return (
    <>
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full px-4 sm:px-6 mt-4">
        {kpiCards.map((card) => (
          <div
            key={card.id}
            onClick={() => card.isClickable && setSelectedCategory(card)}
            className={`shadow-sm rounded-lg p-3 flex items-center gap-3 transition-all relative ${
              card.isClickable
                ? "cursor-pointer hover:shadow-md border border-transparent hover:border-gray-200"
                : "cursor-default"
            }`}
            style={{ backgroundColor: card.bg }}
          >
            <div className="flex items-center justify-center min-w-10 h-10 rounded-full bg-black text-white">
              <Icon icon={card.icon} className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-gray-500 text-[10px] sm:text-xs truncate uppercase">
                {card.label}
              </p>
              <h2 className="text-lg sm:text-xl text-gray-800">{card.value ?? 0}</h2>
            </div>
          </div>
        ))}
      </section>

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-300 ease-in-out ${
          selectedCategory ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedCategory && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <div>
                <h3 className="text-xl text-gray-900">{selectedCategory.label}</h3>
                <p className="text-xs text-gray-500 mt-1">Viewing {items.length} records</p>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Icon icon="heroicons:x-mark-20-solid" className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {items.length > 0 ? (
                <div className="grid gap-3">
                  {items.map((emp, i) => (
                    <div
                      key={i}
                      className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm"
                    >
                      <div className="w-11 h-11 rounded-full bg-black flex items-center justify-center text-white text-sm">
                        {initials(emp.name)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{emp.name}</p>
                        <p className="text-[11px] text-gray-500">{emp.sub || "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                  <Icon icon="solar:user-block-linear" className="w-16 h-16 mb-2" />
                  <p className="text-sm">No records found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedCategory && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
          onClick={() => setSelectedCategory(null)}
        />
      )}
    </>
  );
}
