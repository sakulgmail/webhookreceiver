import { useQuery } from "@tanstack/react-query";

export default function AlertTypesSummary() {
  const { data: alertTypes = {}, isLoading } = useQuery({
    queryKey: ["/api/alerts/types"],
    refetchInterval: 30000,
  });

  const types = [
    { key: "connectivity", label: "Connectivity", color: "bg-meraki-error" },
    { key: "performance", label: "Performance", color: "bg-meraki-warning" },
    { key: "security", label: "Security", color: "bg-blue-500" },
  ];

  const total = Object.values(alertTypes as Record<string, number>).reduce((sum, count) => sum + count, 0);

  const getPercentage = (count: number) => {
    return total > 0 ? (count / total) * 100 : 0;
  };

  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Alert Types (24h)</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-gray-200" data-testid="alert-types-summary">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Alert Types (24h)</h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {types.map((type) => {
            const count = (alertTypes as Record<string, number>)[type.key] || 0;
            const percentage = getPercentage(count);
            
            return (
              <div 
                key={type.key} 
                className="flex items-center justify-between"
                data-testid={`alert-type-${type.key}`}
              >
                <div className="flex items-center">
                  <div className={`w-3 h-3 ${type.color} rounded-full mr-3`}></div>
                  <span className="text-sm font-medium text-gray-700">{type.label}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-900 font-medium mr-2" data-testid={`alert-count-${type.key}`}>
                    {count}
                  </span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-2 ${type.color} rounded-full`} 
                      style={{ width: `${percentage}%` }}
                      data-testid={`alert-percentage-${type.key}`}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {total === 0 && (
          <div className="text-center text-gray-500 py-4" data-testid="no-alert-types">
            No alerts in the last 24 hours
          </div>
        )}
      </div>
    </div>
  );
}
