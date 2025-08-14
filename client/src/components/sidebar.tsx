import { Network, BarChart3, AlertTriangle, History, Settings, FileText } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { icon: BarChart3, label: "Dashboard", href: "/", active: true },
    { icon: AlertTriangle, label: "Active Alerts", href: "/alerts" },
    { icon: History, label: "Alert History", href: "/history" },
    { icon: Settings, label: "Configuration", href: "/config" },
    { icon: FileText, label: "Logs", href: "/logs" },
  ];

  return (
    <aside className="w-64 bg-surface shadow-lg border-r border-gray-200" data-testid="sidebar">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-meraki-primary rounded-lg flex items-center justify-center">
            <Network className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-medium text-gray-900" data-testid="app-title">Meraki Webhook</h1>
            <p className="text-sm text-gray-500">Alert Dashboard</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-6 py-2">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Menu</h2>
        </div>
        <ul className="mt-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <a 
                  href={item.href}
                  className={`flex items-center px-6 py-3 text-sm font-medium ${
                    item.active 
                      ? "bg-blue-50 text-meraki-primary border-r-2 border-meraki-primary" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
        
        <div className="px-6 py-4 mt-8">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Server Status</h2>
          <div className="mt-3 flex items-center">
            <div className="w-3 h-3 bg-meraki-success rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm text-gray-700" data-testid="server-status">Online</span>
          </div>
          <p className="text-xs text-gray-500 mt-1" data-testid="server-uptime">Uptime: Active</p>
        </div>
      </nav>
    </aside>
  );
}
