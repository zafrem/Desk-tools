/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, FileJson } from "lucide-react";

type SchemaType = "Article" | "Person" | "Organization" | "Product";

export default function SchemaMarkupGenPage() {
  const [type, setType] = React.useState<SchemaType>("Article");
  
  // Common Fields
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [image, setImage] = React.useState("");
  
  // Article
  const [headline, setHeadline] = React.useState("");
  const [author, setAuthor] = React.useState("");
  
  // Person
  const [jobTitle, setJobTitle] = React.useState("");
  
  // Product
  const [price, setPrice] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");

  const generateSchema = React.useMemo(() => {
    let schema: any = {
      "@context": "https://schema.org",
      "@type": type,
    };

    if (type === "Article") {
      schema = {
        ...schema,
        headline: headline || "Article Headline",
        image: image ? [image] : undefined,
        author: {
            "@type": "Person",
            "name": author || "Author Name"
        },
        publisher: {
            "@type": "Organization",
            "name": name || "Publisher Name",
            "logo": {
                "@type": "ImageObject",
                "url": "https://example.com/logo.png"
            }
        },
        datePublished: new Date().toISOString()
      };
    } else if (type === "Person") {
        schema = {
            ...schema,
            name: name || "Person Name",
            url: url || undefined,
            jobTitle: jobTitle || undefined,
            image: image || undefined
        };
    } else if (type === "Organization") {
        schema = {
            ...schema,
            name: name || "Organization Name",
            url: url || undefined,
            logo: image || undefined
        };
    } else if (type === "Product") {
        schema = {
            ...schema,
            name: name || "Product Name",
            image: image ? [image] : undefined,
            description: "Product Description",
            brand: {
                "@type": "Brand",
                "name": "Brand Name"
            },
            offers: {
                "@type": "Offer",
                "url": url || undefined,
                "priceCurrency": currency,
                "price": price || "0.00",
                "itemCondition": "https://schema.org/NewCondition",
                "availability": "https://schema.org/InStock"
            }
        };
    }

    return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
  }, [type, name, url, image, headline, author, jobTitle, price, currency]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateSchema);
  };

  return (
    <ToolLayout
      title="Schema Markup Generator"
      description="Create JSON-LD structured data for better SEO."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Schema Type</Label>
                        <Select value={type} onValueChange={(v) => setType(v as SchemaType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Article">Article</SelectItem>
                                <SelectItem value="Person">Person</SelectItem>
                                <SelectItem value="Organization">Organization</SelectItem>
                                <SelectItem value="Product">Product</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {type === "Article" && (
                        <>
                            <div className="space-y-2">
                                <Label>Headline</Label>
                                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Article Title" />
                            </div>
                            <div className="space-y-2">
                                <Label>Author Name</Label>
                                <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label>Publisher Name</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Blog" />
                            </div>
                            <div className="space-y-2">
                                <Label>Image URL</Label>
                                <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
                            </div>
                        </>
                    )}

                    {type === "Person" && (
                        <>
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label>Job Title</Label>
                                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Software Engineer" />
                            </div>
                            <div className="space-y-2">
                                <Label>Website URL</Label>
                                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
                            </div>
                        </>
                    )}

                    {type === "Organization" && (
                        <>
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company Name" />
                            </div>
                            <div className="space-y-2">
                                <Label>Website URL</Label>
                                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Logo URL</Label>
                                <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
                            </div>
                        </>
                    )}

                    {type === "Product" && (
                        <>
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product Name" />
                            </div>
                            <div className="space-y-2">
                                <Label>Image URL</Label>
                                <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Price</Label>
                                    <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="29.99" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Currency</Label>
                                    <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" />
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileJson className="h-5 w-5" /> JSON-LD Output
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Textarea 
                            readOnly 
                            value={generateSchema} 
                            className="font-mono text-xs h-[400px] bg-muted/50 resize-none"
                        />
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="absolute top-2 right-2 h-7"
                            onClick={copyToClipboard}
                        >
                            <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
