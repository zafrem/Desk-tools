/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Trash2 } from "lucide-react";
import { format } from "sql-formatter";

const DIALECTS = [
  { value: "sql", label: "Standard SQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "mariadb", label: "MariaDB" },
  { value: "sqlite", label: "MySQL/MariaDB" },
  { value: "transactsql", label: "SQL Server (T-SQL)" },
  { value: "plsql", label: "SQL Server (PL/SQL)" },
  { value: "db2", label: "DB2" },
  { value: "hive", label: "DB2/Hive" },
  { value: "spark", label: "Spark" },
  { value: "snowflake", label: "Spark/Snowflake" },
  { value: "redshift", label: "Snowflake/Redshift" },
  { value: "bigquery", label: "BigQuery" },
];

export default function SqlFormatterPage() {
  const [input, setInput] = React.useState("SELECT * FROM users WHERE id = 1");
  const [output, setOutput] = React.useState("");
  const [dialect, setDialect] = React.useState("sql");
  const [indent, setIndent] = React.useState("  ");
  const [uppercase, setUppercase] = React.useState(true);

  const handleFormat = React.useCallback(() => {
    try {
      const formatted = format(input, {
        language: dialect as any, // sql-formatter types might be tricky, usually fine or cast to specific union if known
        tabWidth: indent.length,
        useTabs: false,
        keywordCase: uppercase ? "upper" : "preserve",
        linesBetweenQueries: 2,
      });
      setOutput(formatted);
    } catch (e) {
      setOutput((e as Error).message); // Show error in output
    }
  }, [input, dialect, indent, uppercase]);

  React.useEffect(() => {
    handleFormat();
  }, [handleFormat]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <ToolLayout
      title="SQL Formatter"
      description="Format and beautify your SQL queries for better readability."
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
                <Label>Dialect</Label>
                <Select value={dialect} onValueChange={setDialect}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {DIALECTS.map(d => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <Label>Indent</Label>
                <Select value={indent} onValueChange={setIndent}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="  ">2 Spaces</SelectItem>
                        <SelectItem value="    ">4 Spaces</SelectItem>
                        <SelectItem value={"\t"}>Tab</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <Button 
                    variant={uppercase ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setUppercase(!uppercase)}
                >
                    UPPERCASE
                </Button>
            </div>

            <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setInput("")}>
                    <Trash2 className="h-4 w-4 mr-2" /> Clear
                </Button>
                <Button variant="outline" size="sm" onClick={loadSample}>
                    Sample
                </Button>
            </div>
        </div>

        {/* Editor Area */}
        <div className="grid md:grid-cols-2 gap-6 h-[500px]">
            <div className="flex flex-col gap-2 h-full">
                <Label>Input SQL</Label>
                <Textarea 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    className="flex-1 font-mono text-sm resize-none"
                    placeholder="Paste SQL here..."
                />
            </div>

            <div className="flex flex-col gap-2 h-full">
                <div className="flex justify-between items-center">
                    <Label>Formatted Output</Label>
                    <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4 mr-2" /> Copy
                    </Button>
                </div>
                <Card className="flex-1 bg-muted/30 relative overflow-hidden">
                    <CardContent className="p-0 h-full">
                        <Textarea 
                            readOnly 
                            value={output} 
                            className="w-full h-full font-mono text-sm resize-none border-0 bg-transparent focus-visible:ring-0 p-4"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </ToolLayout>
  );

  function loadSample() {
      setInput(`select id, name, email from users where active = 1 and (role = 'admin' or role = 'editor') order by created_at desc limit 10`);
  }
}
