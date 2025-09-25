import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAlertSchema, insertWebhookLogSchema, insertWebhookConfigSchema } from "@shared/schema";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Webhook endpoint for Meraki alerts
  app.post("/api/webhook/meraki", async (req, res) => {
    try {
      storage.incrementWebhookCount();
      
      await storage.createWebhookLog({
        level: "info",
        message: `Webhook received from ${req.ip}`,
        details: { headers: req.headers, body: req.body }
      });

      // Get webhook configuration for validation
      const config = await storage.getWebhookConfig();
      
      // Validate webhook signature if enabled
      if (config?.validateSignature && config?.sharedSecret) {
        const signature = req.headers['x-meraki-signature'] || req.headers['x-cisco-meraki-signature'] || req.headers['x-hub-signature-256'];
        
        if (!signature) {
          await storage.createWebhookLog({
            level: "warn",
            message: "Webhook signature validation enabled but no signature header found",
            details: { headers: req.headers }
          });
          return res.status(401).json({ error: "Signature required but not provided" });
        }

        // Validate the signature
        const body = JSON.stringify(req.body);
        const expectedSignature = createHmac('sha256', config.sharedSecret)
          .update(body)
          .digest('hex');
        
        // Handle different signature formats
        const providedSignature = typeof signature === 'string' 
          ? signature.replace(/^(sha256=|sha256:)/, '')
          : '';
        
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        const providedBuffer = Buffer.from(providedSignature, 'hex');
        
        if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
          await storage.createWebhookLog({
            level: "error",
            message: "Webhook signature validation failed",
            details: { 
              providedSignature: providedSignature,
              expectedSignature: expectedSignature
            }
          });
          return res.status(401).json({ error: "Invalid signature" });
        }

        await storage.createWebhookLog({
          level: "info",
          message: "Webhook signature validated successfully",
          details: { signatureValid: true }
        });
      }

      // Validate and process Meraki webhook payload
      const payload = req.body;
      
      if (!payload || typeof payload !== 'object') {
        await storage.createWebhookLog({
          level: "error",
          message: "Invalid JSON payload received",
          details: { payload }
        });
        return res.status(400).json({ error: "Invalid payload" });
      }

      // Process different types of Meraki alerts
      if (payload.alertType || payload.alertTypeId) {
        const alertType = payload.alertType || 'unknown';
        const deviceName = payload.deviceName || payload.device || 'Unknown Device';
        const alertData = payload.alertData || payload.data || {};
        
        let type = 'connectivity';
        let severity = 'medium';
        let title = alertType;
        let description = JSON.stringify(alertData);

        // Categorize alert types
        if (alertType.toLowerCase().includes('security') || alertType.toLowerCase().includes('unauthorized')) {
          type = 'security';
          severity = 'high';
        } else if (alertType.toLowerCase().includes('performance') || alertType.toLowerCase().includes('cpu') || alertType.toLowerCase().includes('memory')) {
          type = 'performance';
          severity = 'medium';
        } else if (alertType.toLowerCase().includes('connection') || alertType.toLowerCase().includes('offline') || alertType.toLowerCase().includes('down')) {
          type = 'connectivity';
          severity = 'high';
        }

        // Create alert
        const alert = await storage.createAlert({
          type,
          title,
          description,
          device: deviceName,
          severity,
          status: 'active',
          rawPayload: payload
        });

        await storage.createWebhookLog({
          level: "info",
          message: `Alert created: ${title}`,
          details: { alertId: alert.id, type, device: deviceName }
        });
      }

      res.status(200).json({ success: true, message: "Webhook processed successfully" });
    } catch (error) {
      await storage.createWebhookLog({
        level: "error",
        message: `Webhook processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.stack : error }
      });
      
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get dashboard metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getAlertMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Get recent alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const type = req.query.type as string;
      
      let alerts;
      if (type && type !== 'all') {
        alerts = await storage.getAlertsByType(type);
      } else {
        alerts = await storage.getAlerts(limit);
      }
      
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Get alert type distribution
  app.get("/api/alerts/types", async (req, res) => {
    try {
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
      const alerts = await storage.getAlertsInTimeRange(hours);
      
      const typeCount = alerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      res.json(typeCount);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alert types" });
    }
  });

  // Update alert status
  app.patch("/api/alerts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !['active', 'resolved'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const alert = await storage.updateAlertStatus(id, status);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  // Get webhook logs
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getWebhookLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // Clear webhook logs
  app.delete("/api/logs", async (req, res) => {
    try {
      await storage.clearWebhookLogs();
      res.json({ success: true, message: "Logs cleared" });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear logs" });
    }
  });

  // Get webhook configuration
  app.get("/api/webhook/config", async (req, res) => {
    try {
      const config = await storage.getWebhookConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch webhook config" });
    }
  });

  // Update webhook configuration
  app.put("/api/webhook/config", async (req, res) => {
    try {
      const validatedConfig = insertWebhookConfigSchema.parse(req.body);
      const config = await storage.updateWebhookConfig(validatedConfig);
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid configuration", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update webhook config" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
