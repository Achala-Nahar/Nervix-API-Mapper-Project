import React from 'react';
import { LayoutDashboard, FolderKanban, Activity, Bell, Settings, ChevronDown } from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Home', page: 'home', activePages: ['home'] },
  { icon: Activity, label: 'User Activity', page: 'activity', activePages: ['activity'] },
  { icon: Bell, label: 'Notifications', page: 'alerts', activePages: ['alerts'], badge: true },
  { icon: Settings, label: 'Settings', page: 'settings', activePages: ['settings'] },
];

export default function Sidebar({ activePage, setActivePage, user, showNotificationBadge = false }) {
  return (
    <aside className="w-56 bg-dark-bg border-r border-dark-border flex flex-col h-screen fixed left-0 top-0">
      <div className="p-4 flex items-center gap-2 border-b border-dark-border">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-400 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <span className="text-lg font-semibold text-text-primary">nervix</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = item.activePages.includes(activePage);
          return (
            <button
              key={item.label}
              onClick={() => setActivePage(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-dark-card-2 hover:text-text-primary'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge && showNotificationBadge && (
                <span className="absolute top-2 left-5 w-2 h-2 bg-danger rounded-full border-2 border-dark-bg"></span>
              )}
            </button>
          );
        })}
      </nav>


      {/* =========================
           User Profile Button
          ========================= */}
      <div className="p-3 border-t border-dark-border">
        <button
          onClick={() => setActivePage("profile")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            activePage === "profile"
              ? "bg-primary/10 text-primary"
              : "text-text-secondary hover:bg-dark-card-2 hover:text-text-primary"
          }`}
        >
          {/* User Initials */}
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
            {user?.fullName
              ? user.fullName
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase()
              : "AK"}
          </div>

          {/* User Name & Role */}
          <div className="flex-1 text-left overflow-hidden">
            <div
              className={`text-sm font-medium truncate ${
                activePage === "profile"
                  ? "text-primary"
                  : "text-text-primary"
              }`}
            >
              {user?.fullName || "User"}
            </div>

            <div className="text-text-muted text-xs truncate">
              {user?.role || "Member"}
            </div>
          </div>

          {/* Dropdown Icon */}
          <ChevronDown
            size={14}
            className="text-text-muted flex-shrink-0"
          />
        </button>
      </div>



    </aside>
  );
}
