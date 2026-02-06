"use client";

import * as React from "react";
import { Settings, Cpu, Loader2, CheckCircle2, AlertCircle, Info, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPreference, setPreference } from "@/lib/db";

interface OllamaModel {
  name: string;
}

export function SettingsDialog() {
  const { t } = useTranslation("common");
  const [open, setOpen] = React.useState(false);
  const [ollamaBaseUrl, setOllamaBaseUrl] = React.useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = React.useState("");
  const [availableModels, setAvailableModels] = React.useState<string[]>([]);
  const [isTesting, setIsTesting] = React.useState(false);
  const [testStatus, setTestStatus] = React.useState<"idle" | "success" | "error" | "cors">("idle");
  const [showCorsGuide, setShowCorsGuide] = React.useState(false);
  const [copiedCommand, setCopiedCommand] = React.useState(false);

  React.useEffect(() => {
    const loadSettings = async () => {
      const baseUrl = await getPreference("ollama_base_url");
      const model = await getPreference("ollama_model");
      if (baseUrl) setOllamaBaseUrl(baseUrl);
      if (model) setOllamaModel(model);
    };
    if (open) {
      loadSettings();
      setTestStatus("idle");
    }
  }, [open]);

  const testConnection = async () => {
    setIsTesting(true);
    setTestStatus("idle");
    try {
      const response = await fetch(`${ollamaBaseUrl}/api/tags`);
      if (!response.ok) throw new Error("Failed to connect");
      const data = await response.json();
      const models = data.models?.map((m: OllamaModel) => m.name) || [];
      setAvailableModels(models);
      setTestStatus("success");
      if (models.length > 0 && !ollamaModel) {
        setOllamaModel(models[0]);
      }
    } catch (error) {
      console.error("Ollama connection error:", error);
      // TypeError with "Failed to fetch" is typically a CORS or network error
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        setTestStatus("cors");
        setShowCorsGuide(true);
      } else {
        setTestStatus("error");
      }
    } finally {
      setIsTesting(false);
    }
  };

  const copyCommand = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const handleSave = async () => {
    await setPreference("ollama_base_url", ollamaBaseUrl);
    await setPreference("ollama_model", ollamaModel);
    await setPreference(
      "ollama_connected",
      testStatus === "success" ? "true" : "false"
    );
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title={t("labels.settings")}>
          <Settings className="h-5 w-5" />
          <span className="sr-only">{t("labels.settings")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("labels.settings")}
          </DialogTitle>
          <DialogDescription>
            Configure global application settings and local LLM (Ollama) integration.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Ollama Settings
            </h4>
            <p className="text-sm text-muted-foreground">
              Configure your local Ollama instance for AI-powered tools.
            </p>
          </div>
          {/* CORS Setup Guide */}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={() => setShowCorsGuide(!showCorsGuide)}
          >
            <Info className="h-3.5 w-3.5" />
            {showCorsGuide ? "Hide" : "Show"} CORS Setup Guide
          </Button>

          {showCorsGuide && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2.5 text-xs animate-in fade-in slide-in-from-top-2">
              <p className="font-medium text-sm">
                Required: Allow this site in Ollama CORS
              </p>
              <p className="text-muted-foreground">
                Ollama blocks requests from external origins by default.
                Set the <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">OLLAMA_ORIGINS</code> environment variable, then restart Ollama.
              </p>

              <div className="space-y-1.5">
                <p className="font-medium">macOS:</p>
                <div className="flex items-center gap-1.5">
                  <code className="flex-1 bg-background border rounded px-2 py-1.5 font-mono text-[11px] break-all">
                    launchctl setenv OLLAMA_ORIGINS &quot;*&quot;
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyCommand('launchctl setenv OLLAMA_ORIGINS "*"')}
                  >
                    {copiedCommand ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="font-medium">Linux (systemd):</p>
                <div className="flex items-center gap-1.5">
                  <code className="flex-1 bg-background border rounded px-2 py-1.5 font-mono text-[11px] break-all">
                    sudo systemctl edit ollama.service
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyCommand('sudo systemctl edit ollama.service')}
                  >
                    {copiedCommand ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-muted-foreground">Add under <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">[Service]</code>:</p>
                <code className="block bg-background border rounded px-2 py-1.5 font-mono text-[11px]">
                  Environment=&quot;OLLAMA_ORIGINS=*&quot;
                </code>
                <p className="text-muted-foreground">Then run: <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">sudo systemctl daemon-reload && sudo systemctl restart ollama</code></p>
              </div>

              <div className="space-y-1.5">
                <p className="font-medium">Windows:</p>
                <p className="text-muted-foreground">
                  Set system environment variable <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">OLLAMA_ORIGINS</code> to <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">*</code>, then restart Ollama.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="ollama-url">{t("labels.ollamaUrl")}</Label>
            <div className="flex gap-2">
              <Input
                id="ollama-url"
                value={ollamaBaseUrl}
                onChange={(e) => {
                  setOllamaBaseUrl(e.target.value);
                  setTestStatus("idle");
                }}
                placeholder="http://localhost:11434"
                className="flex-1"
              />
              <Button
                variant="secondary"
                onClick={testConnection}
                disabled={isTesting}
                size="sm"
                className="shrink-0"
              >
                {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("buttons.test")}
              </Button>
            </div>
            {testStatus === "success" && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {t("messages.connectedSuccess")}
              </p>
            )}
            {testStatus === "cors" && (
              <div className="text-xs text-destructive space-y-1">
                <p className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> CORS Error: Ollama is blocking this origin.
                </p>
                <p className="text-muted-foreground">
                  Please follow the CORS Setup Guide above, restart Ollama, then test again.
                </p>
              </div>
            )}
            {testStatus === "error" && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {t("messages.connectionFailed")}
              </p>
            )}
          </div>

          {testStatus === "success" && availableModels.length > 0 && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="ollama-model">{t("labels.selectModel")}</Label>
              <Select value={ollamaModel} onValueChange={setOllamaModel}>
                <SelectTrigger id="ollama-model">
                  <SelectValue placeholder={t("labels.selectModel")} />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {testStatus !== "success" && (
            <div className="grid gap-2">
              <Label htmlFor="ollama-model-manual">{t("labels.ollamaModel")} (Manual)</Label>
              <Input
                id="ollama-model-manual"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                placeholder="llama3"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>{t("buttons.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
