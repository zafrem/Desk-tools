"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Plus, Trash2 } from "lucide-react";

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

export default function SitemapGeneratorPage() {
  const [urls, setUrls] = React.useState<SitemapUrl[]>([
    { loc: "https://example.com/", lastmod: new Date().toISOString().split('T')[0], changefreq: "daily", priority: "1.0" }
  ]);

  const addUrl = () => {
    setUrls([...urls, { 
        loc: "https://example.com/page", 
        lastmod: new Date().toISOString().split('T')[0], 
        changefreq: "monthly", 
        priority: "0.8" 
    }]);
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const updateUrl = (index: number, field: keyof SitemapUrl, value: string) => {
    const newUrls = [...urls];
    newUrls[index][field] = value;
    setUrls(newUrls);
  };

  const generateXml = React.useMemo(() => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    return xml;
  }, [urls]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateXml);
  };

  return (
    <ToolLayout
      title="Sitemap Generator"
      description="Create an XML sitemap for your website to help search engines crawl your pages."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_450px]">
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Label className="text-lg">URLs</Label>
                <Button onClick={addUrl} size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Add URL
                </Button>
            </div>

            <div className="space-y-4">
                {urls.map((url, idx) => (
                    <Card key={idx} className="relative">
                        <CardContent className="p-4 space-y-4">
                            {urls.length > 1 && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute top-2 right-2 text-destructive hover:text-destructive"
                                    onClick={() => removeUrl(idx)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                            
                            <div className="space-y-2">
                                <Label>Location (URL)</Label>
                                <Input 
                                    value={url.loc} 
                                    onChange={(e) => updateUrl(idx, 'loc', e.target.value)} 
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Last Modified</Label>
                                    <Input 
                                        type="date"
                                        value={url.lastmod} 
                                        onChange={(e) => updateUrl(idx, 'lastmod', e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Change Freq</Label>
                                    <Select value={url.changefreq} onValueChange={(v) => updateUrl(idx, 'changefreq', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="always">Always</SelectItem>
                                            <SelectItem value="hourly">Hourly</SelectItem>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                            <SelectItem value="never">Never</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select value={url.priority} onValueChange={(v) => updateUrl(idx, 'priority', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['1.0', '0.9', '0.8', '0.7', '0.6', '0.5', '0.4', '0.3', '0.2', '0.1', '0.0'].map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>XML Output</Label>
                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" /> Copy XML
                </Button>
            </div>
            <Textarea 
                readOnly 
                value={generateXml} 
                className="font-mono text-xs h-[600px] bg-muted/50 resize-none whitespace-pre"
            />
        </div>
      </div>
    </ToolLayout>
  );
}
