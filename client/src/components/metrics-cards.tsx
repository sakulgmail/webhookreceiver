import { AlertTriangle, Clock, CheckCircle, Webhook } from "lucide-react";

interface MetricsCardsProps {
  metrics?: {
    activeAlerts: number;
    dailyAlerts: number;
    resolvedAlerts: number;
    webhooksReceived: number;
  };
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      icon: AlertTriangle,
      label: "Active Alerts",
      value: metrics?.activeAlerts ?? 0,
      bgColor: "bg-meraki-error bg-opacity-10",
      iconColor: "text-meraki-error",
      testId: "metric-active-alerts"
    },
    {
      icon: Clock,
      label: "24h Alerts",
      value: metrics?.dailyAlerts ?? 0,
      bgColor: "bg-meraki-warning bg-opacity-10",
      iconColor: "text-meraki-warning",
      testId: "metric-daily-alerts"
    },
    {
      icon: CheckCircle,
      label: "Resolved",
      value: metrics?.resolvedAlerts ?? 0,
      bgColor: "bg-meraki-success bg-opacity-10",
      iconColor: "text-meraki-success",
      testId: "metric-resolved-alerts"
    },
    {
      icon: Webhook,
      label: "Webhooks Received",
      value: metrics?.webhooksReceived ?? 0,
      bgColor: "bg-meraki-primary bg-opacity-10",
      iconColor: "text-meraki-primary",
      testId: "metric-webhooks-received"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="metrics-cards">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div 
            key={card.label}
            className="bg-surface rounded-lg shadow-sm border border-gray-200 p-6"
            data-testid={card.testId}
          >
            <div className="flex items-center">
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`${card.iconColor} text-xl`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900" data-testid={`${card.testId}-value`}>
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
