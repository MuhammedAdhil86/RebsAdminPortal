import React from "react";
import { Icon } from "@iconify/react";
import { useCurrentUser } from "../../store/authStore"; // adjust path if needed

/**
 * Top bar (greeting, bell, avatar) + dashboard title block.
 * The user comes from the auth store, the same data the sidebar shows.
 * Pass `userName`, `title` or `subtitle` only if you want to override them.
 */
export default function DashboardHead({
  userName: userNameProp,
  title,
  subtitle = "Track and manage all details here",
}) {
  const { name, avatarUrl } = useCurrentUser();
  const userName = userNameProp || name;
  // Title uses the short name (the part before "@" when the name is an email)
  const shortName = String(userName).split("@")[0];
  const heading = title || `${shortName} Admin’s Dashboard`;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const avatar = userNameProp
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(userNameProp)}&background=random`
    : avatarUrl;

  return (
    <div className="w-full bg-white relative">
      <div className="w-full flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b bg-white">
        <p className="text-sm sm:text-base text-gray-800 pl-12 md:pl-0 truncate">
          {greeting}, {userName}
        </p>

        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            aria-label="Notifications"
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <Icon icon="mdi:bell-outline" className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full" />
            <span className="text-xs text-gray-700 max-w-[120px] truncate">
              {userName}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-lg sm:text-2xl">{heading}</p>
          <p className="text-[10px] sm:text-[13px] text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
