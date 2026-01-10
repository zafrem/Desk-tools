"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Plus, X } from "lucide-react";

interface Rule {
  agent: string;
  allow: string[];
  disallow: string[];
}

export default function RobotsTxtGeneratorPage() {
  const [sitemap, setSitemap] = React.useState("");
  const [crawlDelay, setCrawlDelay] = React.useState("");
  const [rules, setRules] = React.useState<Rule[]>([
    { agent: "*", allow: [], disallow: [] }
  ]);

  const addRule = () => {
    setRules([...rules, { agent: "*", allow: [], disallow: [] }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof Rule, value: string) => {
    const newRules = [...rules];
    if (field === 'agent') {
        const rule = newRules[index];
        if (rule) rule.agent = value;
    }
    setRules(newRules);
  };

  const addPath = (index: number, type: 'allow' | 'disallow') => {
    const newRules = [...rules];
    newRules[index][type].push("/");
    setRules(newRules);
  };

  const updatePath = (ruleIndex: number, type: 'allow' | 'disallow', pathIndex: number, value: string) => {
    const newRules = [...rules];
    newRules[ruleIndex][type][pathIndex] = value;
    setRules(newRules);
  };

  const removePath = (ruleIndex: number, type: 'allow' | 'disallow', pathIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex][type] = newRules[ruleIndex][type].filter((_, i) => i !== pathIndex);
    setRules(newRules);
  };

  const generateRobotsTxt = React.useMemo(() => {
    let txt = "";
    
    rules.forEach(rule => {
      txt += `User-agent: ${rule.agent}\n`;
      if (crawlDelay) txt += `Crawl-delay: ${crawlDelay}\n`;
      rule.allow.forEach(p => txt += `Allow: ${p}\n`);
      rule.disallow.forEach(p => txt += `Disallow: ${p}\n`);
      txt += "\n";
    });

    if (sitemap) {
      txt += `Sitemap: ${sitemap}`;
    }

    return txt.trim();
  }, [rules, sitemap, crawlDelay]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateRobotsTxt);
  };

  return (
    <ToolLayout
      title="Robots.txt Generator"
      description="Create a robots.txt file to control how search engines crawl your site."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <Label className="text-lg">Rules</Label>
                <Button onClick={addRule} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Add Rule Group
                </Button>
             </div>

             {rules.map((rule, ruleIdx) => (
                 <Card key={ruleIdx} className="relative">
                     <CardContent className="p-4 space-y-4">
                         {rules.length > 1 && (
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-2 right-2 text-destructive hover:text-destructive"
                                onClick={() => removeRule(ruleIdx)}
                             >
                                 <X className="h-4 w-4" />
                             </Button>
                         )}
                         
                         <div className="space-y-2">
                             <Label>User Agent</Label>
                             <div className="flex gap-2">
                                <Select 
                                    value={rule.agent === "*" ? "all" : "custom"} 
                                    onValueChange={(v) => updateRule(ruleIdx, 'agent', v === "all" ? "*" : "")}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select bot" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Robots (*)</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                                {rule.agent !== "*" && (
                                    <Input 
                                        value={rule.agent} 
                                        onChange={(e) => updateRule(ruleIdx, 'agent', e.target.value)}
                                        placeholder="e.g. Googlebot"
                                    />
                                )}
                             </div>
                         </div>

                         <div className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                 <div className="flex justify-between items-center">
                                     <Label className="text-xs text-green-600">Allow</Label>
                                     <Button variant="ghost" size="sm" onClick={() => addPath(ruleIdx, 'allow')} className="h-6 w-6 p-0">
                                         <Plus className="h-3 w-3" />
                                     </Button>
                                 </div>
                                 {rule.allow.map((path, pathIdx) => (
                                     <div key={`allow-${pathIdx}`} className="flex gap-2">
                                         <Input 
                                            value={path} 
                                            onChange={(e) => updatePath(ruleIdx, 'allow', pathIdx, e.target.value)} 
                                            className="h-8 text-xs"
                                         />
                                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removePath(ruleIdx, 'allow', pathIdx)}>
                                             <X className="h-3 w-3" />
                                         </Button>
                                     </div>
                                 ))}
                                 {rule.allow.length === 0 && <div className="text-xs text-muted-foreground italic">No allowed paths</div>}
                             </div>

                             <div className="space-y-2">
                                 <div className="flex justify-between items-center">
                                     <Label className="text-xs text-red-600">Disallow</Label>
                                     <Button variant="ghost" size="sm" onClick={() => addPath(ruleIdx, 'disallow')} className="h-6 w-6 p-0">
                                         <Plus className="h-3 w-3" />
                                     </Button>
                                 </div>
                                 {rule.disallow.map((path, pathIdx) => (
                                     <div key={`disallow-${pathIdx}`} className="flex gap-2">
                                         <Input 
                                            value={path} 
                                            onChange={(e) => updatePath(ruleIdx, 'disallow', pathIdx, e.target.value)} 
                                            className="h-8 text-xs"
                                         />
                                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removePath(ruleIdx, 'disallow', pathIdx)}>
                                             <X className="h-3 w-3" />
                                         </Button>
                                     </div>
                                 ))}
                                 {rule.disallow.length === 0 && <div className="text-xs text-muted-foreground italic">No disallowed paths</div>}
                             </div>
                         </div>
                     </CardContent>
                 </Card>
             ))}
          </div>

          <div className="space-y-4 pt-4 border-t">
              <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label>Sitemap URL (Optional)</Label>
                      <Input 
                        value={sitemap} 
                        onChange={(e) => setSitemap(e.target.value)} 
                        placeholder="https://example.com/sitemap.xml" 
                      />
                  </div>
                  <div className="space-y-2">
                      <Label>Crawl Delay (Optional)</Label>
                      <Input 
                        type="number"
                        value={crawlDelay} 
                        onChange={(e) => setCrawlDelay(e.target.value)} 
                        placeholder="Seconds (e.g. 10)" 
                      />
                  </div>
              </div>
          </div>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>Generated robots.txt</Label>
                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
            </div>
            <Textarea 
                readOnly 
                value={generateRobotsTxt} 
                className="font-mono text-sm h-[500px] bg-muted/50 resize-none"
            />
        </div>
      </div>
    </ToolLayout>
  );
}
