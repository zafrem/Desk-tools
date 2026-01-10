/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, RefreshCw, Key, Lock, Unlock, ShieldCheck, ArrowRight } from "lucide-react";
import * as Crypto from "@/lib/crypto-modern";

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  
  if (!text) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? "Copied!" : <Copy className="h-4 w-4" />}
    </Button>
  );
}

export default function EncryptionToolPage() {
  // AES State
  const [aesKey, setAesKey] = React.useState("");
  const [aesInput, setAesInput] = React.useState("");
  const [aesPassword, setAesPassword] = React.useState("");
  const [aesMode, setAesMode] = React.useState<"encrypt" | "decrypt">("encrypt");
  const [aesMethod, setAesMethod] = React.useState<"password" | "key">("password");
  const [aesResult, setAesResult] = React.useState("");
  const [aesError, setAesError] = React.useState("");

  // RSA Encryption State
  const [rsaPub, setRsaPub] = React.useState("");
  const [rsaPriv, setRsaPriv] = React.useState("");
  const [rsaInput, setRsaInput] = React.useState("");
  const [rsaMode, setRsaMode] = React.useState<"encrypt" | "decrypt">("encrypt");
  const [rsaResult, setRsaResult] = React.useState("");
  const [rsaError, setRsaError] = React.useState("");

  // RSA Signature State
  const [sigPub, setSigPub] = React.useState("");
  const [sigPriv, setSigPriv] = React.useState("");
  const [sigInput, setSigInput] = React.useState("");
  const [signature, setSignature] = React.useState("");
  const [verifyResult, setVerifyResult] = React.useState<boolean | null>(null);
  const [sigError, setSigError] = React.useState("");

  // --- AES Handlers ---
  const generateAesKey = async () => {
    try {
      const key = await Crypto.generateAesKey();
      setAesKey(key);
      setAesMethod("key");
    } catch (e) { console.error(e); }
  };

  const handleAesProcess = async () => {
    setAesResult("");
    setAesError("");
    try {
      if (!aesInput) return;
      const keyOrPass = aesMethod === "password" ? aesPassword : aesKey;
      
      if (!keyOrPass) {
        setAesError(aesMethod === "password" ? "Password required" : "Key required");
        return;
      }

      if (aesMode === "encrypt") {
        const res = await Crypto.encryptAesGcm(aesInput, keyOrPass, aesMethod === "password");
        setAesResult(res);
      } else {
        const res = await Crypto.decryptAesGcm(aesInput, keyOrPass, aesMethod === "password");
        setAesResult(res);
      }
    } catch (e) {
      setAesError((e as Error).message || "Operation failed. Check key/password or input format.");
    }
  };

  // --- RSA Handlers ---
  const generateRsaKeys = async () => {
    try {
        setRsaError("Generating 2048-bit RSA keys... This may take a moment.");
        // Small delay to let UI render the loading message
        setTimeout(async () => {
            try {
                const keys = await Crypto.generateRsaKeyPair();
                setRsaPub(keys.publicKey);
                setRsaPriv(keys.privateKey);
                setRsaError("");
            } catch {
                setRsaError("Key generation failed");
            }
        }, 50);
    } catch (e) { console.error(e); }
  };

  const handleRsaProcess = async () => {
    setRsaResult("");
    setRsaError("");
    try {
        if (!rsaInput) return;

        if (rsaMode === "encrypt") {
            if (!rsaPub) throw new Error("Public key required");
            const res = await Crypto.rsaEncrypt(rsaInput, rsaPub);
            setRsaResult(res);
        } else {
            if (!rsaPriv) throw new Error("Private key required");
            const res = await Crypto.rsaDecrypt(rsaInput, rsaPriv);
            setRsaResult(res);
        }
    } catch (e) {
        setRsaError((e as Error).message);
    }
  };

  // --- Signature Handlers ---
  const generateSigKeys = async () => {
    try {
        setSigError("Generating keys...");
        setTimeout(async () => {
            const keys = await Crypto.generateRsaSignKeyPair();
            setSigPub(keys.publicKey);
            setSigPriv(keys.privateKey);
            setSigError("");
        }, 50);
    } catch (e) { console.error(e); }
  };

  const handleSign = async () => {
    setSignature("");
    setSigError("");
    try {
        if (!sigInput || !sigPriv) throw new Error("Input and Private Key required");
        const sig = await Crypto.rsaSign(sigInput, sigPriv);
        setSignature(sig);
    } catch (e) { setSigError((e as Error).message); }
  };

  const handleVerify = async () => {
    setVerifyResult(null);
    setSigError("");
    try {
        if (!sigInput || !signature || !sigPub) throw new Error("Input, Signature, and Public Key required");
        const isValid = await Crypto.rsaVerify(sigInput, signature, sigPub);
        setVerifyResult(isValid);
    } catch (e) { 
        setVerifyResult(false);
        setSigError((e as Error).message); 
    }
  };


  return (
    <ToolLayout
      title="Encryption Tool"
      description="Secure client-side encryption, decryption, and digital signatures."
    >
      <Tabs defaultValue="aes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="aes" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            AES (Symmetric)
          </TabsTrigger>
          <TabsTrigger value="rsa" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            RSA (Asymmetric)
          </TabsTrigger>
          <TabsTrigger value="sign" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Sign/Verify
          </TabsTrigger>
        </TabsList>

        {/* --- AES TAB --- */}
        <TabsContent value="aes" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="space-y-4 rounded-lg border p-4 bg-card">
                    <Label className="text-base font-semibold">1. Configuration</Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mode</Label>
                            <Select value={aesMode} onValueChange={(v: any) => setAesMode(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="encrypt">Encrypt</SelectItem>
                                    <SelectItem value="decrypt">Decrypt</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Method</Label>
                            <Select value={aesMethod} onValueChange={(v: any) => setAesMethod(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="password">Password Based (PBKDF2)</SelectItem>
                                    <SelectItem value="key">Raw Key (Base64)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {aesMethod === "password" ? (
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input 
                                type="password" 
                                placeholder="Enter a strong password..." 
                                value={aesPassword}
                                onChange={(e) => setAesPassword(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>AES Key (Base64)</Label>
                                <Button variant="outline" size="sm" onClick={generateAesKey} className="h-6 px-2 text-xs">
                                    <RefreshCw className="h-3 w-3 mr-1" /> Generate Random
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Input 
                                    value={aesKey}
                                    onChange={(e) => setAesKey(e.target.value)}
                                    placeholder="Base64 encoded 256-bit key..."
                                    className="font-mono text-xs"
                                />
                                <CopyButton text={aesKey} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <Label className="text-base font-semibold">2. Input</Label>
                    <Textarea 
                        value={aesInput}
                        onChange={(e) => setAesInput(e.target.value)}
                        placeholder={aesMode === "encrypt" ? "Enter text to encrypt..." : "Enter AES-GCM encrypted string (Base64)..."}
                        className="font-mono text-sm min-h-[150px]"
                    />
                    <Button onClick={handleAesProcess} className="w-full">
                        {aesMode === "encrypt" ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
                        {aesMode === "encrypt" ? "Encrypt" : "Decrypt"}
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-base font-semibold">3. Result</Label>
                <div className="relative">
                    <Textarea 
                        readOnly
                        value={aesResult}
                        placeholder="Result will appear here..."
                        className="font-mono text-sm min-h-[300px] bg-muted"
                    />
                    <div className="absolute top-2 right-2">
                        <CopyButton text={aesResult} />
                    </div>
                </div>
                {aesError && (
                    <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                        {aesError}
                    </div>
                )}
            </div>
          </div>
        </TabsContent>

        {/* --- RSA TAB --- */}
        <TabsContent value="rsa" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">
             {/* Left: Keys & Config */}
             <div className="space-y-6">
                <div className="space-y-4 rounded-lg border p-4 bg-card">
                    <div className="flex items-center justify-between">
                         <Label className="text-base font-semibold">Key Pair</Label>
                         <Button variant="outline" size="sm" onClick={generateRsaKeys}>
                            <RefreshCw className="h-3 w-3 mr-1" /> Generate New Pair
                         </Button>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-xs">Public Key (PEM)</Label>
                        <Textarea 
                            value={rsaPub}
                            onChange={(e) => setRsaPub(e.target.value)}
                            className="font-mono text-[10px] h-24"
                            placeholder="-----BEGIN PUBLIC KEY-----..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Private Key (PEM)</Label>
                        <Textarea 
                            value={rsaPriv}
                            onChange={(e) => setRsaPriv(e.target.value)}
                            className="font-mono text-[10px] h-24"
                            placeholder="-----BEGIN PRIVATE KEY-----..."
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Operation</Label>
                    <Select value={rsaMode} onValueChange={(v: any) => setRsaMode(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="encrypt">Encrypt (Use Public Key)</SelectItem>
                            <SelectItem value="decrypt">Decrypt (Use Private Key)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
             </div>
            
             <div className="hidden lg:flex pt-32 justify-center">
                 <ArrowRight className="h-6 w-6 text-muted-foreground" />
             </div>

             {/* Right: Input/Output */}
             <div className="space-y-6">
                <div className="space-y-2">
                    <Label>{rsaMode === 'encrypt' ? 'Plaintext Input' : 'Ciphertext Input (Base64)'}</Label>
                    <Textarea 
                        value={rsaInput}
                        onChange={(e) => setRsaInput(e.target.value)}
                        className="font-mono text-sm min-h-[150px]"
                        placeholder={rsaMode === 'encrypt' ? "Secret message..." : "Encrypted blob..."}
                    />
                </div>

                <Button onClick={handleRsaProcess} className="w-full">
                    {rsaMode === 'encrypt' ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
                    {rsaMode === 'encrypt' ? "Encrypt Message" : "Decrypt Message"}
                </Button>

                <div className="space-y-2 relative">
                    <Label>Result</Label>
                    <Textarea 
                        readOnly
                        value={rsaResult}
                        className="font-mono text-sm min-h-[150px] bg-muted"
                    />
                     <div className="absolute top-8 right-2">
                        <CopyButton text={rsaResult} />
                    </div>
                </div>

                {rsaError && (
                    <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                        {rsaError}
                    </div>
                )}
             </div>
          </div>
        </TabsContent>

        {/* --- SIGNATURE TAB --- */}
        <TabsContent value="sign" className="space-y-6 mt-6">
           <div className="grid lg:grid-cols-2 gap-8">
               <div className="space-y-6">
                   <div className="space-y-4 rounded-lg border p-4 bg-card">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Signing Keys (RSA-PSS)</Label>
                            <Button variant="outline" size="sm" onClick={generateSigKeys}>
                                <RefreshCw className="h-3 w-3 mr-1" /> Generate Pair
                            </Button>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-xs">Private Key (For Signing)</Label>
                            <Textarea 
                                value={sigPriv}
                                onChange={(e) => setSigPriv(e.target.value)}
                                className="font-mono text-[10px] h-20"
                                placeholder="-----BEGIN PRIVATE KEY-----..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Public Key (For Verifying)</Label>
                            <Textarea 
                                value={sigPub}
                                onChange={(e) => setSigPub(e.target.value)}
                                className="font-mono text-[10px] h-20"
                                placeholder="-----BEGIN PUBLIC KEY-----..."
                            />
                        </div>
                   </div>

                   <div className="space-y-2">
                        <Label>Message to Sign / Verify</Label>
                        <Textarea 
                            value={sigInput}
                            onChange={(e) => setSigInput(e.target.value)}
                            className="font-mono text-sm h-32"
                            placeholder="Important contract text..."
                        />
                   </div>
               </div>

               <div className="space-y-6">
                   <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                       <Label className="font-semibold">Generate Signature</Label>
                       <Button size="sm" onClick={handleSign} className="w-full" variant="secondary">
                           Generate Signature
                       </Button>
                       <div className="relative">
                           <Textarea 
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder="Signature will appear here..."
                                className="font-mono text-[10px] h-24"
                           />
                            <div className="absolute top-2 right-2">
                                <CopyButton text={signature} />
                            </div>
                       </div>
                   </div>

                   <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                       <Label className="font-semibold">Verify Signature</Label>
                       <Button size="sm" onClick={handleVerify} className="w-full" variant="secondary">
                           Verify Signature
                       </Button>
                       
                       {verifyResult !== null && (
                           <div className={`p-4 rounded-md flex items-center gap-2 font-medium ${
                               verifyResult 
                               ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" 
                               : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                           }`}>
                               <ShieldCheck className="h-5 w-5" />
                               {verifyResult ? "Signature Valid" : "Signature Invalid"}
                           </div>
                       )}
                   </div>
                   
                   {sigError && (
                        <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                            {sigError}
                        </div>
                    )}
               </div>
           </div>
        </TabsContent>
      </Tabs>
    </ToolLayout>
  );
}
