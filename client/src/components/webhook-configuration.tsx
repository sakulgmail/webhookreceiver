import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

export default function WebhookConfiguration() {
  const { toast } = useToast();
  const [port, setPort] = useState(5000);
  const [validateSignature, setValidateSignature] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");

  const { data: config, isLoading } = useQuery({
    queryKey: ["/api/webhook/config"],
  });

  const saveConfigMutation = useMutation({
    mutationFn: (data: { port: number; validateSignature: boolean }) =>
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
      setPort(config.port || 5000);
      setValidateSignature(config.validateSignature ?? true);
    }
    
    // Construct webhook URL based on current environment
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const currentPort = config?.port || 5000;
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

  const handleSave = () => {
    saveConfigMutation.mutate({ port, validateSignature });
  };

  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Webhook Configuration</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
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
              onChange={(e) => setPort(parseInt(e.target.value) || 5000)}
              className="w-full"
              data-testid="input-server-port"
            />
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
