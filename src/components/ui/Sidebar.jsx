import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { Icon } from "@iconify/react";

import rebsLogo from "../../assets/img/rebslogo.png";
import { logoutCompany } from "../../services/AuthService"; // adjust to your actual filename
import useAuthStore from "../../store/authStore";

function SideBar({ isCollapsed: collapsedProp, toggleSidebar: toggleProp }) {
  const navigate = useNavigate();

  // Works standalone; if parent passes props, those are used instead
  const [collapsedLocal, setCollapsedLocal] = useState(false);
  const isCollapsed = collapsedProp ?? collapsedLocal;
  const toggleSidebar = toggleProp ?? (() => setCollapsedLocal((c) => !c));

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Clients Dashboard");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const openMobileSidebar = () => setIsMobileOpen(true);
  const closeMobileSidebar = () => setIsMobileOpen(false);

  // Logged-in user's email (saved by loginCompany). Falls back to demo name.
  // Only works if your authStore exposes `email` at the top level.
  const email = useAuthStore((s) => s.email);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      // Server errors are swallowed inside logoutCompany,
      // and the auth store is always cleared in its `finally`.
      await logoutCompany();
    } finally {
      setIsProfileOpen(false);
      closeMobileSidebar();
      setIsLoggingOut(false);
      navigate("/login", { replace: true }); // adjust to your login route
    }
  };

  // When collapsed, labels are hidden on desktop only (md and up).
  // On small screens the sidebar is always shown fully expanded.
  const hideWhenCollapsed = isCollapsed ? "md:hidden" : "";

  const displayName = email || "Admin User";
  const userType = "Admin";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName,
  )}&background=random`;

  const icons = {
    // Client management
    clientDashboard: <Icon icon="lucide:layout-dashboard" width="20" />,
    allClients: <Icon icon="lucide:users" width="20" />,
    addClient: <Icon icon="lucide:user-plus" width="20" />,
    clientRequests: <Icon icon="lucide:inbox" width="20" />,
    subscriptions: <Icon icon="lucide:credit-card" width="20" />,
    invoices: <Icon icon="lucide:receipt" width="20" />,
    tickets: <Icon icon="lucide:life-buoy" width="20" />,
    clientReports: <Icon icon="lucide:bar-chart-3" width="20" />,
    activity: <Icon icon="lucide:activity" width="20" />,
    contracts: <Icon icon="lucide:file-text" width="20" />,
  };

  const menuItems = [
    {
      section: "CLIENT MANAGEMENT",
      items: [
        { title: "Clients Dashboard", icon: icons.clientDashboard },
        { title: "All Clients", icon: icons.allClients },
        { title: "Add Client", icon: icons.addClient },
        { title: "Client Requests", icon: icons.clientRequests },
        { title: "Subscriptions", icon: icons.subscriptions },
        { title: "Invoices & Billing", icon: icons.invoices },
        { title: "Contracts", icon: icons.contracts },
        { title: "Support Tickets", icon: icons.tickets },
        { title: "Client Reports", icon: icons.clientReports },
        { title: "Activity Logs", icon: icons.activity },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Hamburger (hidden while the sidebar is open) */}
      <button
        type="button"
        aria-label="Open menu"
        className={`md:hidden p-2 fixed top-4 left-4 z-50 text-black ${
          isMobileOpen ? "hidden" : ""
        }`}
        onClick={openMobileSidebar}
      >
        <Icon icon="flowbite:bars-from-left-outline" width="24" height="24" />
      </button>

      {/* Sidebar: full width + full height on small screens, 20% / 6% on desktop */}
      <div
        className={`bg-black fixed top-0 left-0 z-50 flex flex-col text-white shadow-lg
        transition-[transform,width] duration-300
        w-full h-[100dvh] md:h-[100vh]
        ${isCollapsed ? "md:w-[6%]" : "md:w-[20%]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo + Toggle */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <img
              src={rebsLogo}
              alt="Logo"
              className={`block ${hideWhenCollapsed} h-8 w-8`}
            />
            <span
              className={`text-white text-lg font-normal ${hideWhenCollapsed}`}
            >
              REBS HR
            </span>
          </div>

          {/* Mobile: three-line icon closes the full-screen sidebar */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMobileSidebar}
            className="md:hidden p-1 rounded transition-colors"
          >
            <Icon
              icon="flowbite:bars-from-left-outline"
              width="24"
              height="24"
              className="text-white"
            />
          </button>

          {/* Desktop: collapse / expand */}
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={toggleSidebar}
            className="hidden md:block p-1 rounded transition-colors"
          >
            <Icon
              icon="flowbite:bars-from-left-outline"
              width="24"
              height="24"
              className="text-white"
            />
          </button>
        </div>

        {/* Profile Section */}
        <div className="mt-1 flex flex-col items-center">
          <div
            role="button"
            tabIndex={0}
            onClick={toggleProfile}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleProfile();
              }
            }}
            className={`flex items-center justify-center rounded-lg transition-colors duration-300 cursor-pointer
              w-[90%] px-4 h-14
              ${isProfileOpen ? "bg-gray-600" : "bg-gray-800 hover:bg-gray-600"}
              ${
                isCollapsed
                  ? "md:w-12 md:h-12 md:px-0 md:bg-transparent md:hover:bg-transparent"
                  : ""
              }`}
          >
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-8 h-8 rounded-full"
            />
            <div
              className={`flex-1 text-left ml-3 min-w-0 ${hideWhenCollapsed}`}
            >
              <span className="block text-sm truncate">{displayName}</span>
              <span className="block text-xs text-gray-400">{userType}</span>
            </div>
            <div
              className={`ml-2 transition-transform duration-300 ${hideWhenCollapsed}`}
            >
              <Icon
                icon="mdi:chevron-down"
                className={`w-5 h-5 text-gray-400 ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div
              className={`mt-2 w-[90%] bg-[#1C2526] rounded-lg flex flex-col space-y-1 px-2 py-1 ${hideWhenCollapsed}`}
            >
              <button
                type="button"
                className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-600 transition-colors"
              >
                <Settings size={20} />
                <span className="text-sm flex-1 text-left">Settings</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon="material-symbols:logout" width="20" height="20" />
                <span className="text-sm flex-1 text-left">
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 flex flex-col justify-start mt-7 overflow-y-auto scrollbar-hide">
          {menuItems.map((menu) => (
            <div key={menu.section} className="px-4 mb-2 space-y-2">
              <p
                className={`text-gray-400 text-xs mb-1 px-2 tracking-wider ${hideWhenCollapsed}`}
              >
                {menu.section}
              </p>
              {menu.items.map((item) => {
                const isActive = activeItem === item.title;
                return (
                  <button
                    key={item.title}
                    type="button"
                    title={isCollapsed ? item.title : undefined}
                    onClick={() => {
                      setActiveItem(item.title);
                      closeMobileSidebar(); // close the full-screen sidebar after picking
                    }}
                    className={`h-[40px] w-[90%] ${
                      isCollapsed ? "md:w-full" : ""
                    } flex items-center space-x-3 px-3 rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? "bg-[#1C2526] text-white font-light"
                        : "text-neutral-600 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className={`flex-1 text-left ${hideWhenCollapsed}`}>
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Hide Scrollbar */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </>
  );
}

export default SideBar;
