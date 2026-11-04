import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Settings } from "lucide-react";
import { Icon } from "@iconify/react";

import rebsLogo from "../../assets/img/rebslogo.png";
import { logoutCompany } from "../../services/AuthService"; // adjust to your actual filename
import useAuthStore from "../../store/authStore";

function SideBar({ isCollapsed: collapsedProp, toggleSidebar: toggleProp }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);

  // Works standalone; if parent passes props, those are used instead
  const [collapsedLocal, setCollapsedLocal] = useState(false);
  const isCollapsed = collapsedProp ?? collapsedLocal;
  const toggleSidebar = toggleProp ?? (() => setCollapsedLocal((c) => !c));

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // true only below the md breakpoint (768px)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // On mobile the sidebar is never "collapsed" (always shows labels)
  const collapsed = isCollapsed && !isMobile;

  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  // Keep the selected menu in view: after route change / opening the mobile
  // drawer, scroll the sidebar so the active item is centered.
  useEffect(() => {
    const scrollToActive = () => {
      const nav = navRef.current;
      if (!nav) return;
      const active = nav.querySelector('[aria-current="page"]');
      if (!active) return;
      const target =
        active.offsetTop - nav.clientHeight / 2 + active.clientHeight / 2;
      nav.scrollTo({ top: Math.max(target, 0), behavior: "auto" });
    };
    // wait a frame so the active link and layout are ready
    const id = requestAnimationFrame(scrollToActive);
    return () => cancelAnimationFrame(id);
  }, [location.pathname, isMobileOpen, isMobile, collapsed]);

  // Close the mobile drawer after navigating
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

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
      setIsMobileOpen(false);
      setIsLoggingOut(false);
      navigate("/login", { replace: true }); // adjust to your login route
    }
  };

  const displayName = email || "Admin User";
  const userType = "Admin";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName,
  )}&background=random`;

  const icons = {
    // Client management
    clientDashboard: <Icon icon="lucide:layout-dashboard" width="20" />,
    configuration: <Icon icon="lucide:sliders-horizontal" width="20" />,
    subscriptions: <Icon icon="lucide:credit-card" width="20" />,
    invoices: <Icon icon="lucide:receipt" width="20" />,
    activity: <Icon icon="lucide:activity" width="20" />,
  };

  // Items with a `path` navigate on click. Add `path` to the others
  // as you create their pages/routes.
  const menuItems = [
    {
      section: "CLIENT MANAGEMENT",
      items: [
        {
          title: "Clients Dashboard",
          icon: icons.clientDashboard,
          path: "/dashboard",
        },
        {
          title: "Configuration",
          icon: icons.configuration,
          path: "/configuration",
        },
        {
          title: "Subscriptions",
          icon: icons.subscriptions,
          path: "/subscriptions",
        },
        { title: "Invoices & Billing", icon: icons.invoices },
        { title: "Activity Logs", icon: icons.activity },
      ],
    },
  ];

  const itemBase =
    "h-[40px] flex items-center space-x-3 px-3 rounded-lg transition-all duration-200 text-sm text-white";

  return (
    <>
      {/* Mobile Hamburger (hidden while the drawer is open) */}
      {!isMobileOpen && (
        <button
          type="button"
          aria-label="Open menu"
          className="md:hidden p-2 fixed top-4 left-4 z-40 bg-gray-800 rounded"
          onClick={toggleMobileSidebar}
        >
          <Icon icon="flowbite:bars-from-left-outline" width="24" height="24" />
        </button>
      )}

      {/* Overlay for Mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar: full width + full height on mobile, original widths from md up */}
      <div
        className={`bg-black fixed top-0 left-0 z-50 h-[100dvh] w-full flex flex-col text-white shadow-lg
        transition-transform duration-300
        ${isCollapsed ? "md:w-[6%]" : "md:w-[20%]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo + Toggle */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <img
              src={rebsLogo}
              alt="Logo"
              className={`${collapsed ? "hidden" : "block"} h-8 w-8`}
            />
            {!collapsed && (
              <span className="text-white text-lg font-normal">
                REBS Platform
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label={isMobile ? "Close menu" : "Toggle sidebar"}
            onClick={isMobile ? toggleMobileSidebar : toggleSidebar}
            className="p-1 rounded transition-colors"
          >
            <Icon
              icon={isMobile ? "mdi:close" : "flowbite:bars-from-left-outline"}
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
              ${collapsed ? "w-12 h-12" : "w-[90%] px-4 h-14"}
              ${
                !collapsed &&
                (isProfileOpen
                  ? "bg-gray-600"
                  : "bg-gray-800 hover:bg-gray-600")
              }`}
          >
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-8 h-8 rounded-full"
            />
            {!collapsed && (
              <div className="flex-1 text-left ml-3 min-w-0">
                <span className="block text-sm truncate">{displayName}</span>
                <span className="block text-xs text-gray-400">{userType}</span>
              </div>
            )}
            {!collapsed && (
              <div className="ml-2 transition-transform duration-300">
                <Icon
                  icon="mdi:chevron-down"
                  className={`w-5 h-5 text-gray-400 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          {!collapsed && isProfileOpen && (
            <div className="mt-2 w-[90%] bg-[#1C2526] rounded-lg flex flex-col space-y-1 px-2 py-1">
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
                className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Icon
                  icon={
                    isLoggingOut
                      ? "line-md:loading-loop"
                      : "material-symbols:logout"
                  }
                  width="20"
                  height="20"
                />
                <span className="text-sm flex-1 text-left">
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Menu */}
        <nav
          ref={navRef}
          className="relative flex-1 flex flex-col justify-start mt-7 overflow-y-auto scrollbar-hide"
        >
          {menuItems.map((menu) => (
            <div key={menu.section} className="px-4 mb-2 space-y-2">
              {!collapsed && (
                <p className="text-gray-400 text-xs mb-1 px-2 tracking-wider">
                  {menu.section}
                </p>
              )}
              {menu.items.map((item) => {
                const content = (
                  <>
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <span className="flex-1 text-left">{item.title}</span>
                    )}
                  </>
                );

                // Items without a page yet: same look, no navigation
                if (!item.path) {
                  return (
                    <button
                      key={item.title}
                      type="button"
                      title={collapsed ? item.title : undefined}
                      className={`${itemBase} hover:bg-gray-800`}
                      style={{ width: collapsed ? "100%" : "90%" }}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <NavLink
                    key={item.title}
                    to={item.path}
                    title={collapsed ? item.title : undefined}
                    className={({ isActive }) =>
                      `${itemBase} ${
                        isActive
                          ? "bg-[#1C2526] font-light"
                          : "hover:bg-gray-800"
                      }`
                    }
                    style={{ width: collapsed ? "100%" : "90%" }}
                  >
                    {content}
                  </NavLink>
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
