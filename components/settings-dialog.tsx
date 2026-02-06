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
  const [provider, setProvider] = React.useState<"ollama" | "vllm" | "sglang">("ollama");
  const [ollamaBaseUrl, setOllamaBaseUrl] = React.useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");
  const [availableModels, setAvailableModels] = React.useState<string[]>([]);
  const [isTesting, setIsTesting] = React.useState(false);
  const [testStatus, setTestStatus] = React.useState<"idle" | "success" | "error" | "cors">("idle");
  const [showSetupGuide, setShowSetupGuide] = React.useState(false);
  const [showVllmGuide, setShowVllmGuide] = React.useState(false);
  const [showSglangGuide, setShowSglangGuide] = React.useState(false);
  const [copiedCommand, setCopiedCommand] = React.useState(false);

  React.useEffect(() => {
    const loadSettings = async () => {
      const savedProvider = await getPreference("llm_provider") as "ollama" | "vllm" | "sglang" | null;
      const baseUrl = await getPreference("ollama_base_url");
      const model = await getPreference("ollama_model");
      const savedApiKey = await getPreference("llm_api_key");
      
      if (savedProvider) setProvider(savedProvider);
      if (baseUrl) setOllamaBaseUrl(baseUrl);
      if (model) setOllamaModel(model);
      if (savedApiKey) setApiKey(savedApiKey);
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
      if (provider === "ollama") {
        const response = await fetch(`${ollamaBaseUrl}/api/tags`);
        if (!response.ok) throw new Error("Failed to connect");
        const data = await response.json();
        const models = data.models?.map((m: OllamaModel) => m.name) || [];
        setAvailableModels(models);
        setTestStatus("success");
        if (models.length > 0 && !ollamaModel) {
          setOllamaModel(models[0]);
        }
      } else {
        // vLLM and SGLang usually have OpenAI compatible /v1/models
        const response = await fetch(`${ollamaBaseUrl}/v1/models`, {
          headers: apiKey ? { "Authorization": `Bearer ${apiKey}` } : {}
        });
        if (!response.ok) throw new Error("Failed to connect");
        const data = await response.json();
        const models = data.data?.map((m: { id: string }) => m.id) || [];
        setAvailableModels(models);
        setTestStatus("success");
        if (models.length > 0 && !ollamaModel) {
          setOllamaModel(models[0]);
        }
      }
    } catch (error) {
      console.error("LLM connection error:", error);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        setTestStatus("cors");
        if (provider === "ollama") setShowSetupGuide(true);
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
    await setPreference("llm_provider", provider);
    await setPreference("ollama_base_url", ollamaBaseUrl);
    await setPreference("ollama_model", ollamaModel);
    await setPreference("llm_api_key", apiKey);
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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("labels.settings")}
          </DialogTitle>
          <DialogDescription>
            Configure global application settings and local LLM integration.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              LLM Provider
            </h4>
            <p className="text-sm text-muted-foreground">
              Choose your local LLM engine.
            </p>
            <Select value={provider} onValueChange={(val: "ollama" | "vllm" | "sglang") => {
              setProvider(val);
              setTestStatus("idle");
              if (val === "ollama" && ollamaBaseUrl.includes(":8000")) setOllamaBaseUrl("http://localhost:11434");
              if ((val === "vllm" || val === "sglang") && ollamaBaseUrl.includes(":11434")) setOllamaBaseUrl("http://localhost:8000");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ollama">Ollama</SelectItem>
                <SelectItem value="vllm">vLLM (OpenAI Compatible) [Beta]</SelectItem>
                <SelectItem value="sglang">SGLang (OpenAI Compatible) [Beta]</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 pt-2 border-t">
            {provider === "ollama" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <h5 className="text-sm font-medium">Ollama Setup</h5>
                  <p className="text-xs text-muted-foreground">Run Ollama locally. Ensure OLLAMA_ORIGINS is set.</p>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => setShowSetupGuide(!showSetupGuide)}
                >
                  <Info className="h-3.5 w-3.5" />
                  {showSetupGuide ? "Hide" : "Show"} {t("setupGuide.title")}
                </Button>

                {showSetupGuide && (
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-4 text-xs animate-in fade-in slide-in-from-top-2">
                    {/* Step 1: Platform Installation */}
                    <div className="space-y-2">
                      <p className="font-bold text-sm text-primary flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("setupGuide.step1.title")}
                      </p>
                      <p className="text-muted-foreground">{t("setupGuide.step1.description")}</p>
                      
                      <div className="bg-background/50 border rounded-md p-2 space-y-2 mt-1">
                        <p className="font-medium text-[11px]">{t("setupGuide.step1.corsTitle")}</p>
                        <p className="text-[10px] text-muted-foreground">{t("setupGuide.step1.corsDesc")}</p>
                        
                        <div className="space-y-1">
                          <p className="font-medium text-[10px]">macOS:</p>
                          <div className="flex items-center gap-1">
                            <code className="flex-1 bg-muted px-1.5 py-1 rounded font-mono text-[10px] break-all">
                              {'launchctl setenv OLLAMA_ORIGINS "*"'}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => copyCommand('launchctl setenv OLLAMA_ORIGINS "*"')}
                            >
                              {copiedCommand ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="font-medium text-[10px]">Linux (systemd):</p>
                          <code className="block bg-muted px-1.5 py-1 rounded font-mono text-[10px]">
                            {'Environment="OLLAMA_ORIGINS=*"'}
                          </code>
                        </div>

                        <div className="space-y-1">
                          <p className="font-medium text-[10px]">Windows:</p>
                          <p className="text-[10px] text-muted-foreground">
                            Set system environment variable <code className="bg-muted px-0.5 rounded font-mono">OLLAMA_ORIGINS</code> to <code className="bg-muted px-0.5 rounded font-mono">*</code>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Model List */}
                    <div className="space-y-1.5 border-t pt-2">
                      <p className="font-bold text-sm text-primary flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("setupGuide.step2.title")}
                      </p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-1">
                        <li>{t("setupGuide.step2.test")}</li>
                        <li>{t("setupGuide.step2.select")}</li>
                      </ul>
                    </div>

                    {/* Step 3: Model Operation */}
                    <div className="space-y-1.5 border-t pt-2">
                      <p className="font-bold text-sm text-primary flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("setupGuide.step3.title")}
                      </p>
                      <p className="text-muted-foreground">{t("setupGuide.step3.description")}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {provider === "vllm" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <h5 className="text-sm font-medium flex items-center gap-2">
                    vLLM Setup
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Beta</span>
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Support for vLLM is currently in beta and may not work as expected.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => setShowVllmGuide(!showVllmGuide)}
                >
                  <Info className="h-3.5 w-3.5" />
                  {showVllmGuide ? "Hide" : "Show"} {t("vllmGuide.title")}
                </Button>

                {showVllmGuide && (
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-4 text-xs animate-in fade-in slide-in-from-top-2">
                    {/* Step 1: Installation */}
                    <div className="space-y-2">
                      <p className="font-bold text-sm text-primary flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("vllmGuide.step1.title")}
                      </p>
                      <p className="text-muted-foreground">{t("vllmGuide.step1.description")}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <code className="flex-1 bg-background border rounded px-2 py-1.5 font-mono text-[10px] break-all">
                          pip install vllm
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => copyCommand('pip install vllm')}
                        >
                          {copiedCommand ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Step 2: Start Server */}
                    <div className="space-y-2 border-t pt-2">
                      <p className="font-bold text-sm text-primary flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("vllmGuide.step2.title")}
                      </p>
                      <p className="text-muted-foreground">{t("vllmGuide.step2.description")}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <code className="flex-1 bg-background border rounded px-2 py-1.5 font-mono text-[10px] break-all">
                          {'vllm serve "CohereLabs/c4ai-command-r-plus"'}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => copyCommand('vllm serve "CohereLabs/c4ai-command-r-plus"')}
                        >
                          {copiedCommand ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Step 3: Configuration */}
                    <div className="space-y-1.5 border-t pt-2">
                      <p className="font-bold text-sm text-primary flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("vllmGuide.step3.title")}
                      </p>
                      <p className="text-muted-foreground">{t("vllmGuide.step3.description")}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {provider === "sglang" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <h5 className="text-sm font-medium flex items-center gap-2">
                    SGLang Setup
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Beta</span>
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Support for SGLang is currently in beta and may not work as expected.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => setShowSglangGuide(!showSglangGuide)}
                >
                  <Info className="h-3.5 w-3.5" />
                  {showSglangGuide ? "Hide" : "Show"} {t("sglangGuide.title")}
                </Button>

                {showSglangGuide && (
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-4 text-xs animate-in fade-in slide-in-from-top-2">
                    {/* Step 1: Installation */}
                    <div className="space-y-2">
                      <p className="font-bold text-sm text-primary flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("sglangGuide.step1.title")}
                      </p>
                      <p className="text-muted-foreground">{t("sglangGuide.step1.description")}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <code className="flex-1 bg-background border rounded px-2 py-1.5 font-mono text-[10px] break-all">
                          pip install sglang
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => copyCommand('pip install sglang')}
                        >
                          {copiedCommand ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Step 2: Start Server */}
                    <div className="space-y-2 border-t pt-2">
                      <p className="font-bold text-sm text-primary flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("sglangGuide.step2.title")}
                      </p>
                      <p className="text-muted-foreground">{t("sglangGuide.step2.description")}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <code className="flex-1 bg-background border rounded px-2 py-1.5 font-mono text-[10px] break-all">
                          {'python3 -m sglang.launch_server --model-path "CohereLabs/c4ai-command-r-plus" --host 0.0.0.0 --port 30000'}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => copyCommand('python3 -m sglang.launch_server --model-path "CohereLabs/c4ai-command-r-plus" --host 0.0.0.0 --port 30000')}
                        >
                          {copiedCommand ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Step 3: Configuration */}
                    <div className="space-y-1.5 border-t pt-2">
                      <p className="font-bold text-sm text-primary flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("sglangGuide.step3.title")}
                      </p>
                      <p className="text-muted-foreground">{t("sglangGuide.step3.description")}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="base-url">Base URL</Label>
              <div className="flex gap-2">
                <Input
                  id="base-url"
                  value={ollamaBaseUrl}
                  onChange={(e) => {
                    setOllamaBaseUrl(e.target.value);
                    setTestStatus("idle");
                  }}
                  placeholder={provider === "ollama" ? "http://localhost:11434" : "http://localhost:8000"}
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
                    <AlertCircle className="h-3 w-3" /> CORS Error: Server is blocking this origin.
                  </p>
                  <p className="text-muted-foreground">
                    Ensure the server allows requests from this domain.
                  </p>
                </div>
              )}
              {testStatus === "error" && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {t("messages.connectionFailed")}
                </p>
              )}
            </div>

            {(provider === "vllm" || provider === "sglang") && (
              <div className="grid gap-2">
                <Label htmlFor="api-key">API Key (Optional)</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key if required"
                />
              </div>
            )}

            {testStatus === "success" && availableModels.length > 0 && (
              <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="model-select">Select Model</Label>
                <Select value={ollamaModel} onValueChange={setOllamaModel}>
                  <SelectTrigger id="model-select">
                    <SelectValue placeholder="Select a model" />
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
                <Label htmlFor="model-manual">Model Name (Manual)</Label>
                <Input
                  id="model-manual"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder={provider === "ollama" ? "llama3" : "facebook/opt-125m"}
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>{t("buttons.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

