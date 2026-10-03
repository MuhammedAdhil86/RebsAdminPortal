import React, { useEffect, useRef, useState, useCallback } from "react";
import { Outlet, useLocation, useNavigation } from "react-router-dom";
import SideBar from "../components/ui/Sidebar";
import Header from "../components/dashboard/DashboardHead";

const COLLAPSE_KEY = "sidebarCollapsed";

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * The only place the sidebar and header exist.
 * Every protected page renders inside <Outlet />.
 */
export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(readCollapsed);
  const scrollRef = useRef(null);
  const { pathname } = useLocation();
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";

  const toggleSidebar = useCallback(() => setIsCollapsed((c) => !c), []);

  // Remember the sidebar state between visits.
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, isCollapsed ? "1" : "0");
    } catch {
      /* storage unavailable: ignore */
    }
  }, [isCollapsed]);

  // The scroll container is this div (not window), so reset it on navigation.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="poppins-root h-screen w-full bg-white">
      <SideBar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      <div
        className={`h-full transition-all duration-300 ${
          isCollapsed ? "md:ml-[6%]" : "md:ml-[20%]"
        }`}
      >
        <div className="h-full flex flex-col w-full">
          <div
            ref={scrollRef}
            className="relative flex-1 overflow-y-auto w-full scrollbar-hide"
          >
            {/* Thin progress bar while a page chunk loads */}
            {isNavigating && (
              <div
                role="progressbar"
                aria-label="Loading page"
                className="fixed top-0 left-0 right-0 h-0.5 z-[60] bg-black animate-pulse"
              />
            )}

            <Header />

            <main
              className={`transition-opacity duration-150 ${
                isNavigating ? "opacity-60" : "opacity-100"
              }`}
            >
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap");
        .poppins-root, .poppins-root * { font-family: "Poppins", sans-serif !important; font-weight: 400 !important; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
