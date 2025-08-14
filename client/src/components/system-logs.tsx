import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { WebhookLog } from "@shared/schema";

export default function SystemLogs() {
  const { toast } = useToast();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["/api/logs"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const clearLogsMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/logs"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({
        title: "Logs cleared",
        description: "All system logs have been cleared",
      });
    },
    onError: () => {
      toast({
        title: "Clear failed",
        description: "Failed to clear system logs",
        variant: "destructive",
      });
    },
  });

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return "text-red-400";
      case "warn":
        return "text-yellow-400";
      case "info":
        return "text-green-400";
      case "debug":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const handleClearLogs = () => {
    clearLogsMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">System Logs</h2>
        </div>
        <div className="p-6">
          <div className="bg-gray-900 rounded-lg p-4 h-64">
            <div className="animate-pulse space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-700 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-gray-200" data-testid="system-logs">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">System Logs</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearLogs}
          disabled={clearLogsMutation.isPending || logs.length === 0}
          data-testid="button-clear-logs"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Logs
        </Button>
      </div>
      <div className="p-6">
        <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm" data-testid="logs-container">
          <div className="space-y-1 text-gray-300">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8" data-testid="no-logs">
                No logs available
              </div>
            ) : (
              logs.map((log: WebhookLog) => (
                <div key={log.id} className="flex" data-testid={`log-entry-${log.id}`}>
                  <span className="text-gray-500 mr-3" data-testid={`log-time-${log.id}`}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={getLevelColor(log.level)} data-testid={`log-level-${log.id}`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="ml-2" data-testid={`log-message-${log.id}`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
