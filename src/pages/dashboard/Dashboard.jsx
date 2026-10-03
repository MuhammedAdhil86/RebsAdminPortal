import React from "react";
import StatCardArea from "../../components/dashboard/StatCardArea";
import DashboardOverview from "../../components/dashboard/DashboardOverview";

// Sidebar and header are rendered by MainLayout, so this page is content only.
function Dashboard() {
  return (
    <>
      <StatCardArea />
      <DashboardOverview />
    </>
  );
}

export default Dashboard;
