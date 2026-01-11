/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Simplified IP Calc Logic (for IPv4)
function calculateSubnet(ip: string, mask: number) {
  if (!ip.match(/^(\d{1,3}\.){3}\d{1,3}$/)) return null;
  const ipParts = ip.split('.').map(Number);
  if (ipParts.some(p => p > 255)) return null;

  const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
  const maskNum = 0xffffffff << (32 - mask);
  
  const networkNum = ipNum & maskNum;
  const broadcastNum = networkNum | (~maskNum);
  
  const numToIp = (num: number) => {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join('.');
  };

  const hosts = Math.pow(2, 32 - mask) - 2;

  return {
    networkAddress: numToIp(networkNum),
    broadcastAddress: numToIp(broadcastNum),
    firstHost: numToIp(networkNum + 1),
    lastHost: numToIp(broadcastNum - 1),
    hosts: hosts > 0 ? hosts : 0,
    maskStr: numToIp(maskNum),
    class: ipParts[0] < 128 ? 'A' : ipParts[0] < 192 ? 'B' : ipParts[0] < 224 ? 'C' : 'D/E',
  };
}

export default function IpSubnetCalculatorPage() {
  const [ip, setIp] = React.useState("192.168.1.1");
  const [cidr, setCidr] = React.useState("24");
  const [result, setResult] = React.useState<any>(null);

  React.useEffect(() => {
    const res = calculateSubnet(ip, parseInt(cidr));
    setResult(res);
  }, [ip, cidr]);

  return (
    <ToolLayout
      title="IP Subnet Calculator"
      description="Calculate network range, broadcast address, and usable hosts for IPv4."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Network Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[1fr_120px] gap-4 items-end">
                <div className="space-y-2">
                  <Label>IP Address</Label>
                  <Input 
                    value={ip} 
                    onChange={(e) => setIp(e.target.value)} 
                    placeholder="192.168.0.1" 
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CIDR</Label>
                  <Select value={cidr} onValueChange={setCidr}>
                    <SelectTrigger className="font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 33 }).map((_, i) => (
                        <SelectItem key={i} value={i.toString()}>/{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {result && (
            <div className="grid md:grid-cols-2 gap-4">
               <Card>
                 <CardContent className="p-4 space-y-1">
                   <div className="text-xs text-muted-foreground uppercase">Network Address</div>
                   <div className="text-lg font-mono font-bold text-primary">{result.networkAddress}</div>
                 </CardContent>
               </Card>
               <Card>
                 <CardContent className="p-4 space-y-1">
                   <div className="text-xs text-muted-foreground uppercase">Broadcast Address</div>
                   <div className="text-lg font-mono font-bold text-primary">{result.broadcastAddress}</div>
                 </CardContent>
               </Card>
               <Card>
                 <CardContent className="p-4 space-y-1">
                   <div className="text-xs text-muted-foreground uppercase">Subnet Mask</div>
                   <div className="text-lg font-mono font-bold">{result.maskStr}</div>
                 </CardContent>
               </Card>
               <Card>
                 <CardContent className="p-4 space-y-1">
                   <div className="text-xs text-muted-foreground uppercase">IP Class</div>
                   <div className="text-lg font-mono font-bold">{result.class}</div>
                 </CardContent>
               </Card>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="h-full bg-muted/20">
            <CardHeader>
              <CardTitle>Host Range</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {result ? (
                <>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Usable Hosts</div>
                    <div className="text-3xl font-bold">{result.hosts.toLocaleString()}</div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground uppercase">First Usable Host</div>
                      <div className="font-mono bg-background p-2 rounded border">{result.firstHost}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground uppercase">Last Usable Host</div>
                      <div className="font-mono bg-background p-2 rounded border">{result.lastHost}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">Invalid IP Address</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
