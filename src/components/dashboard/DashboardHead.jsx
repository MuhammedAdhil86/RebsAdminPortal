import React from "react";
import { Icon } from "@iconify/react";

/** Top bar (greeting, bell, avatar) + dashboard title block. */
export default function DashboardHead({
  userName,
  title = `${userName} Admin’s Dashboard`,
  subtitle = "Track and manage all details here",
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="w-full bg-white font-poppins relative">
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

      <div className="w-full sm:px-6 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-lg sm:text-2xl">{title}</p>
          <p className="text-[10px] sm:text-[13px] text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
