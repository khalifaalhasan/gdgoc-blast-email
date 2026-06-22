import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Mail, Settings, LogOut, ChevronRight, Search, Bell } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Campaigns", href: "/dashboard/campaign", icon: Mail },
    { name: "Settings", href: "#", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[color:var(--lt-bg)] text-[color:var(--lt-text-primary)] transition-colors">
      {/* Sidebar */}
      <div className="w-64 bg-[color:var(--lt-sidebar)] flex flex-col justify-between border-r border-[color:var(--lt-border)] relative z-20">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[color:var(--lt-primary)] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary/20">
              GD
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Admin
            </h2>
          </div>
          <nav className="mt-2 px-4 space-y-1.5">
            {navigation.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== "/dashboard" &&
                  location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`lt-nav-item flex items-center justify-between ${isActive ? "active" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={`w-5 h-5 ${isActive ? "text-white" : "text-inherit"}`}
                    />
                    {item.name}
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-white" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[color:var(--lt-border)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[color:var(--lt-primary)] flex items-center justify-center text-white font-bold text-xs">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Admin User</span>
              <span className="text-[10px] text-[color:var(--lt-text-secondary)] truncate w-24">admin@gdgoc...</span>
            </div>
          </div>
          <button className="text-[color:var(--lt-text-secondary)] hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 bg-[color:var(--lt-bg)] flex items-center justify-between px-8 shrink-0 z-10 sticky top-0 border-b border-transparent">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--lt-text-secondary)]" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-[color:var(--lt-sidebar)] border border-[color:var(--lt-border)] rounded-lg pl-9 pr-4 py-2 text-xs text-[color:var(--lt-text-primary)] placeholder-[color:var(--lt-text-secondary)] focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-[color:var(--lt-text-secondary)] hover:text-[color:var(--lt-text-primary)] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[color:var(--lt-bg)]"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
