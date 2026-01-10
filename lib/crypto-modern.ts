/* eslint-disable @typescript-eslint/no-explicit-any */
export type SymmetricKey = string; // Base64
export type KeyPair = { publicKey: string; privateKey: string }; // PEM format

// --- Utilities ---

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function pemHeader(type: "PUBLIC" | "PRIVATE"): string {
  return `-----BEGIN ${type} KEY-----`;
}

function pemFooter(type: "PUBLIC" | "PRIVATE"): string {
  return `-----END ${type} KEY-----`;
}

function formatPem(base64: string, type: "PUBLIC" | "PRIVATE"): string {
  const header = pemHeader(type);
  const footer = pemFooter(type);
  let body = "";
  for (let i = 0; i < base64.length; i += 64) {
    body += base64.substring(i, i + 64) + "\n";
  }
  return `${header}\n${body}${footer}`;
}

function stripPem(pem: string): string {
  return pem
    .replace(/-----BEGIN (.*) KEY-----/, "")
    .replace(/-----END (.*) KEY-----/, "")
    .replace(/\s/g, "");
}

// --- AES-GCM ---

export async function generateAesKey(): Promise<string> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exported);
}

export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any, 
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptAesGcm(text: string, passwordOrKey: string, isPassword = true): Promise<string> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  let key: CryptoKey;
  let salt: Uint8Array | null = null;

  if (isPassword) {
    salt = window.crypto.getRandomValues(new Uint8Array(16));
    key = await deriveKeyFromPassword(passwordOrKey, salt);
  } else {
    // Treat as raw base64 key
    const keyBuffer = base64ToArrayBuffer(passwordOrKey);
    key = await window.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      "AES-GCM",
      true,
      ["encrypt"]
    );
  }

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    enc.encode(text)
  );

  // Combine Salt (if pw) + IV + Ciphertext
  const parts: ArrayBuffer[] = [];
  if (salt) parts.push(salt.buffer as ArrayBuffer);
  parts.push(iv.buffer as ArrayBuffer);
  parts.push(encrypted);

  const blob = new Blob(parts);
  const buffer = await blob.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

export async function decryptAesGcm(ciphertextBase64: string, passwordOrKey: string, isPassword = true): Promise<string> {
  const fullBuffer = base64ToArrayBuffer(ciphertextBase64);
  const bytes = new Uint8Array(fullBuffer);
  
  let offset = 0;
  let key: CryptoKey;

  if (isPassword) {
    if (bytes.length < 16 + 12) throw new Error("Invalid ciphertext length (missing salt/iv)");
    const salt = bytes.slice(0, 16);
    offset += 16;
    key = await deriveKeyFromPassword(passwordOrKey, salt);
  } else {
    const keyBuffer = base64ToArrayBuffer(passwordOrKey);
    key = await window.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      "AES-GCM",
      true,
      ["decrypt"]
    );
  }

  if (bytes.length < offset + 12) throw new Error("Invalid ciphertext length (missing iv)");
  const iv = bytes.slice(offset, offset + 12);
  offset += 12;
  const data = bytes.slice(offset);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}

// --- RSA ---

export async function generateRsaKeyPair(): Promise<KeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exportedPub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const exportedPriv = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: formatPem(arrayBufferToBase64(exportedPub), "PUBLIC"),
    privateKey: formatPem(arrayBufferToBase64(exportedPriv), "PRIVATE"),
  };
}

export async function generateRsaSignKeyPair(): Promise<KeyPair> {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-PSS",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );
  
    const exportedPub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const exportedPriv = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  
    return {
      publicKey: formatPem(arrayBufferToBase64(exportedPub), "PUBLIC"),
      privateKey: formatPem(arrayBufferToBase64(exportedPriv), "PRIVATE"),
    };
  }

export async function rsaEncrypt(text: string, publicKeyPem: string): Promise<string> {
  const enc = new TextEncoder();
  const binaryDer = base64ToArrayBuffer(stripPem(publicKeyPem));
  
  const key = await window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    enc.encode(text)
  );

  return arrayBufferToBase64(encrypted);
}

export async function rsaDecrypt(ciphertextBase64: string, privateKeyPem: string): Promise<string> {
  const binaryDer = base64ToArrayBuffer(stripPem(privateKeyPem));
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);

  const key = await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["decrypt"]
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

export async function rsaSign(text: string, privateKeyPem: string): Promise<string> {
    const enc = new TextEncoder();
    const binaryDer = base64ToArrayBuffer(stripPem(privateKeyPem));
    
    const key = await window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
        name: "RSA-PSS",
        hash: "SHA-256",
        },
        false,
        ["sign"]
    );
    
    const signature = await window.crypto.subtle.sign(
        {
        name: "RSA-PSS",
        saltLength: 32,
        },
        key,
        enc.encode(text)
    );
    
    return arrayBufferToBase64(signature);
}

export async function rsaVerify(text: string, signatureBase64: string, publicKeyPem: string): Promise<boolean> {
    const enc = new TextEncoder();
    const binaryDer = base64ToArrayBuffer(stripPem(publicKeyPem));
    const signature = base64ToArrayBuffer(signatureBase64);
    
    const key = await window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        {
        name: "RSA-PSS",
        hash: "SHA-256",
        },
        false,
        ["verify"]
    );
    
    return window.crypto.subtle.verify(
        {
        name: "RSA-PSS",
        saltLength: 32,
        },
        key,
        signature,
        enc.encode(text)
    );
}
