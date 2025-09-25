import { alerts, webhookLogs, webhookConfig, type Alert, type InsertAlert, type WebhookLog, type InsertWebhookLog, type WebhookConfig, type InsertWebhookConfig } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, and, gte } from "drizzle-orm";
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

export class DatabaseStorage implements IStorage {
  private webhookCount: number = 0;

  constructor() {
    this.webhookCount = 0;
    this.initializeDefaultConfig();
  }

  private async initializeDefaultConfig() {
    const existing = await db.select().from(webhookConfig).limit(1);
    if (existing.length === 0) {
      await db.insert(webhookConfig).values({
        port: 5010,
        validateSignature: true,
        sharedSecret: '',
        isActive: true,
      });
    }
  }

  async getAlerts(limit: number = 50): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .orderBy(desc(alerts.timestamp))
      .limit(limit);
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.status, 'active'));
  }

  async getAlertsByType(type: string): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.type, type));
  }

  async getAlertsInTimeRange(hours: number): Promise<Alert[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await db
      .select()
      .from(alerts)
      .where(gte(alerts.timestamp, cutoff));
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db
      .insert(alerts)
      .values({
        ...insertAlert,
        status: insertAlert.status || 'active',
        rawPayload: insertAlert.rawPayload || null,
      })
      .returning();
    return newAlert;
  }

  async updateAlertStatus(id: string, status: string): Promise<Alert | undefined> {
    const [updatedAlert] = await db
      .update(alerts)
      .set({ status })
      .where(eq(alerts.id, id))
      .returning();
    return updatedAlert || undefined;
  }

  async getWebhookLogs(limit: number = 100): Promise<WebhookLog[]> {
    return await db
      .select()
      .from(webhookLogs)
      .orderBy(desc(webhookLogs.timestamp))
      .limit(limit);
  }

  async createWebhookLog(insertLog: InsertWebhookLog): Promise<WebhookLog> {
    const [newLog] = await db
      .insert(webhookLogs)
      .values({
        ...insertLog,
        details: insertLog.details || null,
      })
      .returning();
    return newLog;
  }

  async clearWebhookLogs(): Promise<void> {
    await db.delete(webhookLogs);
  }

  async getWebhookConfig(): Promise<WebhookConfig | undefined> {
    const configs = await db.select().from(webhookConfig).limit(1);
    return configs[0] || undefined;
  }

  async updateWebhookConfig(config: InsertWebhookConfig): Promise<WebhookConfig> {
    const existing = await this.getWebhookConfig();
    
    if (existing) {
      const [updatedConfig] = await db
        .update(webhookConfig)
        .set({
          port: config.port ?? existing.port,
          validateSignature: config.validateSignature ?? existing.validateSignature,
          sharedSecret: config.sharedSecret ?? existing.sharedSecret,
          isActive: config.isActive ?? existing.isActive,
        })
        .where(eq(webhookConfig.id, existing.id))
        .returning();
      return updatedConfig;
    } else {
      const [newConfig] = await db
        .insert(webhookConfig)
        .values({
          port: config.port ?? 5010,
          validateSignature: config.validateSignature ?? true,
          sharedSecret: config.sharedSecret ?? '',
          isActive: config.isActive ?? true,
        })
        .returning();
      return newConfig;
    }
  }

  async getAlertMetrics(): Promise<{
    activeAlerts: number;
    dailyAlerts: number;
    resolvedAlerts: number;
    webhooksReceived: number;
  }> {
    const [activeResult] = await db
      .select({ count: count() })
      .from(alerts)
      .where(eq(alerts.status, 'active'));
    
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [dailyResult] = await db
      .select({ count: count() })
      .from(alerts)
      .where(gte(alerts.timestamp, cutoff));
    
    const [resolvedResult] = await db
      .select({ count: count() })
      .from(alerts)
      .where(eq(alerts.status, 'resolved'));
    
    return {
      activeAlerts: activeResult.count,
      dailyAlerts: dailyResult.count,
      resolvedAlerts: resolvedResult.count,
      webhooksReceived: this.webhookCount,
    };
  }

  incrementWebhookCount() {
    this.webhookCount++;
  }
}

export const storage = new DatabaseStorage();
