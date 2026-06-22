import { Mail, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const metrics = [
    {
      title: "Total Campaigns",
      value: "12",
      description: "+2 from last month",
      icon: Mail,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Emails Sent",
      value: "4,231",
      description: "+800 this week",
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Success Rate",
      value: "98.5%",
      description: "Consistent high delivery",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Failed Deliveries",
      value: "24",
      description: "Requires attention",
      icon: AlertCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tighter text-[color:var(--lt-text-primary)]">
          Dashboard Overview
        </h1>
        <p className="text-sm text-[color:var(--lt-text-secondary)] mt-1 font-medium">
          Welcome back! Here's a quick summary of your email blast metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className="lt-card p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2.5 rounded-full ${metric.bg}`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[color:var(--lt-text-secondary)] mb-1 uppercase tracking-wider">
                {metric.title}
              </p>
              <h3 className="text-2xl font-black tracking-tight text-[color:var(--lt-text-primary)]">
                {metric.value}
              </h3>
              <p className="text-[11px] text-[color:var(--lt-text-secondary)] mt-1 font-medium">
                {metric.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 lt-card p-6">
          <h3 className="text-lg font-bold mb-4 tracking-tight text-[color:var(--lt-text-primary)]">
            Recent Activity
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 py-3 border-b border-border/50">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Campaign "GDGoC Cloud Next 2026" completed
                </p>
                <p className="text-xs text-muted-foreground">
                  Sent 450 emails successfully
                </p>
              </div>
              <span className="text-xs text-muted-foreground">2 hours ago</span>
            </div>
            <div className="flex items-center gap-4 py-3 border-b border-border/50">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Created new draft "Info Session Volunteers"
                </p>
              </div>
              <span className="text-xs text-muted-foreground">5 hours ago</span>
            </div>
            <div className="flex items-center gap-4 py-3">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  3 emails failed in "Study Jam #1"
                </p>
                <p className="text-xs text-muted-foreground">
                  Invalid email formats detected
                </p>
              </div>
              <span className="text-xs text-muted-foreground">1 day ago</span>
            </div>
          </div>
        </div>

        <div className="lt-card p-6">
          <h3 className="text-lg font-bold mb-4 tracking-tight text-[color:var(--lt-text-primary)]">
            Quick Actions
          </h3>
          <div className="flex flex-col gap-3">
            <Link
              to="/dashboard/campaign/create"
              className="lt-btn-primary w-full"
            >
              Create New Campaign
            </Link>
            <Link to="/dashboard/campaign" className="lt-btn-secondary w-full">
              View All Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
