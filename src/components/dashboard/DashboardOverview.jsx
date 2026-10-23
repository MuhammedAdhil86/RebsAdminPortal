import React, { useState, useEffect } from "react";
import CompaniesTab from "./CompaniesTab"; // adjust paths if needed
import EnquiriesTab from "./EnquiriesTab";
import SubscriptionsTab from "./SubscriptionTab";

const TABS = [
  { label: "Companies", key: "companies" },
  { label: "Enquiries", key: "enquiries" },
  { label: "Subscriptions", key: "subscriptions" },
];

/** Tab navigation + the active tab's content. Owns the active-tab state. */
export default function DashboardOverview() {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem("dashboardActiveTab");
      return TABS.some((t) => t.key === saved) ? saved : "companies";
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
    <>
      <section className="bg-white mt-4 sm:mt-6 w-full px-4 sm:px-6">
        <div className="border-b flex flex-wrap gap-4 sm:gap-6 pt-4 text-sm">
          {TABS.map((tab) => (
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

      <div className="mt-6 flex flex-col gap-6 w-full m-0 p-0">
        {activeTab === "companies" && <CompaniesTab />}
        {activeTab === "enquiries" && <EnquiriesTab />}
        {activeTab === "subscriptions" && <SubscriptionsTab />}
      </div>
    </>
  );
}
