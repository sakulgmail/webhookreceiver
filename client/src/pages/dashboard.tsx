import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import MetricsCards from "@/components/metrics-cards";
import RecentAlertsTable from "@/components/recent-alerts-table";
import AlertTypesSummary from "@/components/alert-types-summary";
import WebhookConfiguration from "@/components/webhook-configuration";
import SystemLogs from "@/components/system-logs";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { toast } = useToast();
  const [lastUpdate, setLastUpdate] = useState<string>("Just now");

  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ["/api/metrics"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLastUpdate(now.toLocaleTimeString());
    }, 60000); // Update time every minute

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    try {
      await refetchMetrics();
      setLastUpdate("Just now");
      toast({
        title: "Dashboard refreshed",
        description: "Data has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to update dashboard data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-meraki-background" data-testid="dashboard">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="bg-surface shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-medium text-gray-900" data-testid="page-title">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Monitor and manage Meraki network alerts</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Last updated: <span data-testid="last-update">{lastUpdate}</span>
              </div>
              <Button 
                onClick={handleRefresh}
                className="bg-meraki-primary text-white hover:bg-blue-700"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          <MetricsCards metrics={metrics} />
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <div className="xl:col-span-2">
              <RecentAlertsTable />
            </div>
            <AlertTypesSummary />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WebhookConfiguration />
            <SystemLogs />
          </div>
        </div>
      </main>
    </div>
  );
}
