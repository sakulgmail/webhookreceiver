import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { Alert } from "@shared/schema";

export default function RecentAlertsTable() {
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["/api/alerts", { type: typeFilter }],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "security":
        return "bg-blue-100 text-blue-800";
      case "connectivity":
        return "bg-red-100 text-red-800";
      case "performance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-meraki-error";
      case "resolved":
        return "bg-meraki-success";
      default:
        return "bg-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Alerts</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-gray-200" data-testid="recent-alerts-table">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Recent Alerts</h2>
        <div className="flex items-center space-x-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32" data-testid="select-alert-type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="connectivity">Connectivity</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" data-testid="button-view-all">
            View All
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alert
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-gray-200">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500" data-testid="no-alerts">
                  No alerts found
                </td>
              </tr>
            ) : (
              alerts.map((alert: Alert) => (
                <tr key={alert.id} className="hover:bg-gray-50" data-testid={`alert-row-${alert.id}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 ${getStatusDotColor(alert.status)} rounded-full mr-3`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900" data-testid={`alert-title-${alert.id}`}>
                          {alert.title}
                        </p>
                        <p className="text-sm text-gray-500" data-testid={`alert-description-${alert.id}`}>
                          {alert.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getTypeColor(alert.type)} data-testid={`alert-type-${alert.id}`}>
                      {alert.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900" data-testid={`alert-device-${alert.id}`}>
                    {alert.device}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500" data-testid={`alert-time-${alert.id}`}>
                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(alert.status)} data-testid={`alert-status-${alert.id}`}>
                      {alert.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
