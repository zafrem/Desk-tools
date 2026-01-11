"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const PERMISSIONS = [
  { id: "read", label: "Read", value: 4, symbol: "r" },
  { id: "write", label: "Write", value: 2, symbol: "w" },
  { id: "execute", label: "Execute", value: 1, symbol: "x" },
];

const ENTITIES = [
  { id: "owner", label: "Owner" },
  { id: "group", label: "Group" },
  { id: "public", label: "Public" },
];

export default function ChmodCalculatorPage() {
  const [perms, setPerms] = React.useState<Record<string, Record<string, boolean>>>({
    owner: { read: false, write: false, execute: false },
    group: { read: false, write: false, execute: false },
    public: { read: false, write: false, execute: false },
  });

  const [octal, setOctal] = React.useState("000");
  const [symbolic, setSymbolic] = React.useState("---------");

  React.useEffect(() => {
    let newOctal = "";
    let newSymbolic = "";

    ENTITIES.forEach((entity) => {
      let entityVal = 0;
      PERMISSIONS.forEach((perm) => {
        if (perms[entity.id][perm.id]) {
          entityVal += perm.value;
          newSymbolic += perm.symbol;
        } else {
          newSymbolic += "-";
        }
      });
      newOctal += entityVal;
    });

    setOctal(newOctal);
    setSymbolic(newSymbolic);
  }, [perms]);

  const togglePerm = (entityId: string, permId: string) => {
    setPerms((prev) => ({
      ...prev,
      [entityId]: {
        ...prev[entityId],
        [permId]: !prev[entityId][permId],
      },
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <ToolLayout
      title="Chmod Calculator"
      description="Visual permission calculator for Linux/Unix file systems."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-4 gap-4 mb-4 font-semibold text-center border-b pb-2">
                <div className="text-left">Permission</div>
                {ENTITIES.map((e) => (
                  <div key={e.id}>{e.label}</div>
                ))}
              </div>
              {PERMISSIONS.map((perm) => (
                <div key={perm.id} className="grid grid-cols-4 gap-4 items-center py-2 text-center">
                  <div className="text-left font-medium">{perm.label}</div>
                  {ENTITIES.map((entity) => (
                    <div key={`${entity.id}-${perm.id}`} className="flex justify-center">
                      <Checkbox
                        checked={perms[entity.id][perm.id]}
                        onCheckedChange={() => togglePerm(entity.id, perm.id)}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Octal Notation</Label>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 px-3 py-2 rounded-md border bg-muted/50 font-mono text-lg flex items-center justify-center font-bold">
                    {octal}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(octal)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  chmod {octal} filename
                </div>
              </div>

              <div className="space-y-2">
                <Label>Symbolic Notation</Label>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 px-3 py-2 rounded-md border bg-muted/50 font-mono text-lg flex items-center justify-center font-bold tracking-widest">
                    {symbolic}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(symbolic)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
