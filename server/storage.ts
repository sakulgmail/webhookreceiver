import { type Alert, type InsertAlert, type WebhookLog, type InsertWebhookLog, type WebhookConfig, type InsertWebhookConfig } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Alert operations
  getAlerts(limit?: number): Promise<Alert[]>;
  getActiveAlerts(): Promise<Alert[]>;
  getAlertsByType(type: string): Promise<Alert[]>;
  getAlertsInTimeRange(hours: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlertStatus(id: string, status: string): Promise<Alert | undefined>;
  
  // Webhook log operations
  getWebhookLogs(limit?: number): Promise<WebhookLog[]>;
  createWebhookLog(log: InsertWebhookLog): Promise<WebhookLog>;
  clearWebhookLogs(): Promise<void>;
  
  // Webhook config operations
  getWebhookConfig(): Promise<WebhookConfig | undefined>;
  updateWebhookConfig(config: InsertWebhookConfig): Promise<WebhookConfig>;
  
  // Metrics
  getAlertMetrics(): Promise<{
    activeAlerts: number;
    dailyAlerts: number;
    resolvedAlerts: number;
    webhooksReceived: number;
  }>;
}

export class MemStorage implements IStorage {
  private alerts: Map<string, Alert>;
  private webhookLogs: Map<string, WebhookLog>;
  private webhookConfig: WebhookConfig | undefined;
  private webhookCount: number = 0;

  constructor() {
    this.alerts = new Map();
    this.webhookLogs = new Map();
    this.webhookCount = 0;
    
    // Initialize default config
    this.webhookConfig = {
      id: randomUUID(),
      port: 5000,
      validateSignature: true,
      isActive: true,
    };
  }

  async getAlerts(limit: number = 50): Promise<Alert[]> {
    const alerts = Array.from(this.alerts.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    return alerts;
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'active');
  }

  async getAlertsByType(type: string): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(alert => alert.type === type);
  }

  async getAlertsInTimeRange(hours: number): Promise<Alert[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.alerts.values()).filter(alert => 
      new Date(alert.timestamp) > cutoff
    );
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const alert: Alert = {
      ...insertAlert,
      id,
      timestamp: new Date(),
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async updateAlertStatus(id: string, status: string): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.status = status;
      this.alerts.set(id, alert);
      return alert;
    }
    return undefined;
  }

  async getWebhookLogs(limit: number = 100): Promise<WebhookLog[]> {
    const logs = Array.from(this.webhookLogs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    return logs;
  }

  async createWebhookLog(insertLog: InsertWebhookLog): Promise<WebhookLog> {
    const id = randomUUID();
    const log: WebhookLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
    };
    this.webhookLogs.set(id, log);
    return log;
  }

  async clearWebhookLogs(): Promise<void> {
    this.webhookLogs.clear();
  }

  async getWebhookConfig(): Promise<WebhookConfig | undefined> {
    return this.webhookConfig;
  }

  async updateWebhookConfig(config: InsertWebhookConfig): Promise<WebhookConfig> {
    if (this.webhookConfig) {
      this.webhookConfig = { ...this.webhookConfig, ...config };
    } else {
      this.webhookConfig = {
        id: randomUUID(),
        ...config,
      };
    }
    return this.webhookConfig;
  }

  async getAlertMetrics(): Promise<{
    activeAlerts: number;
    dailyAlerts: number;
    resolvedAlerts: number;
    webhooksReceived: number;
  }> {
    const activeAlerts = await this.getActiveAlerts();
    const dailyAlerts = await this.getAlertsInTimeRange(24);
    const resolvedAlerts = Array.from(this.alerts.values()).filter(alert => alert.status === 'resolved');
    
    return {
      activeAlerts: activeAlerts.length,
      dailyAlerts: dailyAlerts.length,
      resolvedAlerts: resolvedAlerts.length,
      webhooksReceived: this.webhookCount,
    };
  }

  incrementWebhookCount() {
    this.webhookCount++;
  }
}

export const storage = new MemStorage();
