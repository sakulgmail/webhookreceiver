import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { type WebhookConfig } from "@shared/schema";

export default function WebhookConfiguration() {
  const { toast } = useToast();
  const [port, setPort] = useState(5010);
  const [validateSignature, setValidateSignature] = useState(true);
  const [sharedSecret, setSharedSecret] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const { data: config, isLoading } = useQuery<WebhookConfig>({
    queryKey: ["/api/webhook/config"],
  });

  const saveConfigMutation = useMutation({
    mutationFn: (data: { port: number; validateSignature: boolean; sharedSecret: string }) =>
      apiRequest("PUT", "/api/webhook/config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhook/config"] });
      toast({
        title: "Configuration saved",
        description: "Webhook configuration has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Failed to save webhook configuration",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (config) {
      setPort(config.port || 5010);
      setValidateSignature(config.validateSignature ?? true);
      setSharedSecret(config.sharedSecret || '');
    }
    
    // Construct webhook URL based on current environment
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const currentPort = config?.port || 5010;
    const url = `${protocol}//${hostname}:${currentPort}/api/webhook/meraki`;
    setWebhookUrl(url);
  }, [config]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast({
        title: "URL copied",
        description: "Webhook URL has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy URL to clipboard",
        variant: "destructive",
      });
    }
  };

  const generateSharedSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSharedSecret(result);
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(sharedSecret);
      toast({
        title: "Secret copied",
        description: "Shared secret has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy shared secret to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    saveConfigMutation.mutate({ port, validateSignature, sharedSecret });
  };

  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Webhook Configuration</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-gray-200" data-testid="webhook-configuration">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Webhook Configuration</h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="webhook-url"
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1"
                data-testid="input-webhook-url"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                data-testid="button-copy-url"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="server-port" className="block text-sm font-medium text-gray-700 mb-2">
              Server Port
            </Label>
            <Input
              id="server-port"
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 5010)}
              className="w-full"
              data-testid="input-server-port"
            />
          </div>

          <div>
            <Label htmlFor="shared-secret" className="block text-sm font-medium text-gray-700 mb-2">
              Shared Secret
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="shared-secret"
                type="password"
                value={sharedSecret}
                onChange={(e) => setSharedSecret(e.target.value)}
                className="flex-1"
                placeholder="Enter or generate a shared secret"
                data-testid="input-shared-secret"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={generateSharedSecret}
                data-testid="button-generate-secret"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySecret}
                disabled={!sharedSecret}
                data-testid="button-copy-secret"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This secret must be configured in your Meraki dashboard for webhook signature validation
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="validate-signature"
              checked={validateSignature}
              onCheckedChange={(checked) => setValidateSignature(checked as boolean)}
              data-testid="checkbox-validate-signature"
            />
            <Label htmlFor="validate-signature" className="text-sm text-gray-700">
              Validate webhook signature
            </Label>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={saveConfigMutation.isPending}
              className="w-full bg-meraki-primary text-white hover:bg-blue-700"
              data-testid="button-save-configuration"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
