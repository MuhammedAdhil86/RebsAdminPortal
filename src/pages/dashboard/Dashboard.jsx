import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import SideBar from "../../components/ui/Sidebar";
import CompaniesTab, {
  initials,
  COMPANY_ONBOARDING,
  USER_ONBOARDING,
} from "../../components/dashboard/CompaniesTab";
import EnquiriesTab from "../../components/dashboard/EnquiriesTab";
import SubscriptionsTab from "../../components/dashboard/SubscriptionTab";
import { getEnquiries } from "../../services/Enquiries"; // adjust to your actual filename

/* ------------------------------------------------------------------ */
/*  HEADER (placeholder for HeaderGlobal)                             */
/* ------------------------------------------------------------------ */

function HeaderGlobal({ userName }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="w-full flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b bg-white">
      <p className="text-sm sm:text-base text-gray-800 pl-12 md:pl-0">
        {greeting}, {userName}
      </p>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Icon icon="mdi:bell-outline" className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
            alt="avatar"
            className="w-8 h-8 rounded-full"
          />
          <span className="text-xs text-gray-700">{userName}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DASHBOARD HEAD                                                    */
/* ------------------------------------------------------------------ */

function DashboardHead({ userName, activeTab, setActiveTab }) {
  const safeCompanies = Array.isArray(COMPANY_ONBOARDING)
    ? COMPANY_ONBOARDING
    : [];
  const safeUsers = Array.isArray(USER_ONBOARDING) ? USER_ONBOARDING : [];

  // Real enquiries from the API (errors are toasted by the axios interceptor)
  const [enquiries, setEnquiries] = useState([]);

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

  // "New" enquiries = not yet paid/converted
  const newEnquiries = enquiries.filter((e) => !e.is_paid);

  // Enquiry count per service, e.g. HRMS: 8, CRM: 4
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
      items: safeCompanies.map((c) => ({
        name: c.company,
        sub: `${c.plan} plan`,
      })),
    },
    onboarding: {
      count: safeCompanies.filter((c) => c.status === "In Progress").length,
      items: safeCompanies
        .filter((c) => c.status === "In Progress")
        .map((c) => ({
          name: c.company,
          sub: `${c.stage} · ${c.progress}%`,
        })),
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
    enquiry_services: {
      count: serviceItems.length,
      items: serviceItems,
    },
    pending_documents: {
      count: safeCompanies.filter((c) => c.status === "Pending").length,
      items: safeCompanies
        .filter((c) => c.status === "Pending")
        .map((c) => ({
          name: c.company,
          sub: c.stage,
        })),
    },
  };

  const [selectedCategory, setSelectedCategory] = useState(null);

  const kpiCards = [
    {
      id: "total_companies",
      label: "Total Companies",
      value: dashboardData.total_companies.count,
      bg: "#EBFDEF",
      icon: "mdi:office-building-outline",
      isClickable: true,
    },
    {
      id: "onboarding",
      label: "Onboarding",
      value: dashboardData.onboarding.count,
      bg: "#E8EFF9",
      icon: "mdi:progress-clock",
      isClickable: true,
    },
    {
      id: "total_users",
      label: "Total Users",
      value: dashboardData.total_users.count,
      bg: "#FFEFE7",
      icon: "mdi:account-group-outline",
      isClickable: true,
    },
    {
      id: "new_enquiries",
      label: "New Enquiries",
      value: dashboardData.new_enquiries.count,
      bg: "#FFFBDB",
      icon: "mdi:message-text-outline",
      isClickable: true,
    },
    {
      id: "enquiry_services",
      label: "Enquiry Services",
      value: dashboardData.enquiry_services.count,
      bg: "#F1E9FF",
      icon: "mdi:apps",
      isClickable: true,
    },
    {
      id: "pending_documents",
      label: "Pending Documents",
      value: dashboardData.pending_documents.count,
      bg: "#FFDADA",
      icon: "mdi:file-clock-outline",
      isClickable: true,
    },
  ];

  return (
    <div className="w-full bg-white font-poppins relative">
      <HeaderGlobal userName={userName} />

      <div className="w-full sm:px-6 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-lg sm:text-2xl">{userName} Admin’s Dashboard</p>
          <p className="text-[10px] sm:text-[13px] text-gray-400">
            Track and manage all details here
          </p>
        </div>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full px-4 sm:px-6 mt-4">
        {kpiCards.map((card, idx) => (
          <div
            key={idx}
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
              <h2 className="text-lg sm:text-xl text-gray-800">
                {card.value ?? 0}
              </h2>
            </div>
          </div>
        ))}
      </section>

      {/* Side panel for stat card lists */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-300 ease-in-out ${
          selectedCategory ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedCategory && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <div>
                <h3 className="text-xl text-gray-900">
                  {selectedCategory.label}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Viewing{" "}
                  {dashboardData[selectedCategory.id]?.items?.length || 0}{" "}
                  records
                </p>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Icon
                  icon="heroicons:x-mark-20-solid"
                  className="w-6 h-6 text-gray-400"
                />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {dashboardData[selectedCategory.id]?.items?.length > 0 ? (
                <div className="grid gap-3">
                  {dashboardData[selectedCategory.id].items.map((emp, i) => (
                    <div
                      key={i}
                      className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm"
                    >
                      <div className="w-11 h-11 rounded-full bg-black flex items-center justify-center text-white text-sm">
                        {initials(emp.name)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{emp.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {emp.sub || "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                  <Icon
                    icon="solar:user-block-linear"
                    className="w-16 h-16 mb-2"
                  />
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

      {/* Tabs navigation: 3 tabs only */}
      <section className="bg-white mt-4 sm:mt-6 w-full px-4 sm:px-6">
        <div className="border-b flex flex-wrap gap-4 sm:gap-6 pt-4 text-sm">
          {[
            { label: "Companies", key: "companies" },
            { label: "Enquiries", key: "enquiries" },
            { label: "Subscriptions", key: "subscriptions" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2 whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "border-b-2 border-black text-black"
                  : "text-[#AFAFAF]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DASHBOARD PAGE                                                    */
/* ------------------------------------------------------------------ */

function Dashboard({ userName = "Admin" }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem("dashboardActiveTab");
      return ["companies", "enquiries", "subscriptions"].includes(saved)
        ? saved
        : "companies";
    } catch {
      return "companies";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("dashboardActiveTab", activeTab);
    } catch {
      /* ignore */
    }
  }, [activeTab]);

  return (
    <div className="poppins-root h-screen w-full bg-white">
      <SideBar
        isCollapsed={isCollapsed}
        toggleSidebar={() => setIsCollapsed((c) => !c)}
      />

      <div
        className={`h-full transition-all duration-300 ${
          isCollapsed ? "md:ml-[6%]" : "md:ml-[20%]"
        }`}
      >
        <div className="h-full flex flex-col w-full m-0 p-0">
          <div className="flex-1 overflow-y-auto w-full m-0 p-0 scrollbar-hide">
            <DashboardHead
              userName={userName}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            <div className="mt-6 flex flex-col gap-6 w-full m-0 p-0">
              {activeTab === "companies" && <CompaniesTab />}
              {activeTab === "enquiries" && <EnquiriesTab />}
              {activeTab === "subscriptions" && <SubscriptionsTab />}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap");
        .poppins-root,
        .poppins-root * {
          font-family: "Poppins", sans-serif !important;
          font-weight: 400 !important;
        }
      `}</style>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default Dashboard;
