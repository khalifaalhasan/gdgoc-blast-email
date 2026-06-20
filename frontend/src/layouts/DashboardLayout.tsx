import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Mail, Settings, LogOut } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";

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
      <div className="w-56 bg-[color:var(--lt-sidebar)] flex flex-col justify-between shadow-[1px_0_10px_rgba(0,0,0,0.02)] relative z-20">
        <div>
          <div className="p-6">
            <h2 className="text-xl font-black text-[color:var(--lt-primary)] tracking-tighter">GDGoC Blast</h2>
          </div>
          <nav className="mt-2 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`lt-nav-item ${isActive ? "active" : ""}`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-[color:var(--lt-primary)]" : "text-inherit"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-[color:var(--lt-border)]">
          <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[color:var(--lt-text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-medium">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 bg-[color:var(--lt-sidebar)] flex items-center justify-between px-6 shrink-0 z-10 sticky top-0 shadow-[0_1px_10px_rgba(0,0,0,0.02)]">
          <div className="font-bold text-[color:var(--lt-text-primary)] text-lg tracking-tight">
            Dashboard
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="w-8 h-8 text-sm rounded-full bg-[color:var(--lt-bg)] flex items-center justify-center text-[color:var(--lt-text-primary)] font-bold border border-[color:var(--lt-border)] cursor-pointer">
              A
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
