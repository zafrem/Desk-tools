export interface HashType {
  name: string;
  length: number;
  description: string;
}

export const COMMON_HASHES: HashType[] = [
  { name: "CRC32", length: 8, description: "Cyclic Redundancy Check (32-bit)" },
  { name: "MD5", length: 32, description: "Message Digest Algorithm 5" },
  { name: "MD4", length: 32, description: "Message Digest Algorithm 4" },
  { name: "NTLM", length: 32, description: "NT LAN Manager (Windows)" },
  { name: "SHA-1", length: 40, description: "Secure Hash Algorithm 1" },
  { name: "RIPEMD-160", length: 40, description: "RACE Integrity Primitives Evaluation Message Digest" },
  { name: "SHA-224", length: 56, description: "Secure Hash Algorithm 2 (224-bit)" },
  { name: "SHA3-224", length: 56, description: "Secure Hash Algorithm 3 (224-bit)" },
  { name: "SHA-256", length: 64, description: "Secure Hash Algorithm 2 (256-bit)" },
  { name: "SHA3-256", length: 64, description: "Secure Hash Algorithm 3 (256-bit)" },
  { name: "BLAKE2s", length: 64, description: "Fast cryptographic hash (256-bit)" },
  { name: "SHA-384", length: 96, description: "Secure Hash Algorithm 2 (384-bit)" },
  { name: "SHA3-384", length: 96, description: "Secure Hash Algorithm 3 (384-bit)" },
  { name: "SHA-512", length: 128, description: "Secure Hash Algorithm 2 (512-bit)" },
  { name: "SHA3-512", length: 128, description: "Secure Hash Algorithm 3 (512-bit)" },
  { name: "BLAKE2b", length: 128, description: "Fast cryptographic hash (512-bit)" },
];

export function calculateShannonEntropy(str: string): number {
  if (!str) return 0;
  const frequencies: Record<string, number> = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  let entropy = 0;
  const len = str.length;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export function identifyHashTypes(hash: string): HashType[] {
  const trimmedHash = hash.trim();
  const isHex = /^[0-9a-fA-F]+$/.test(trimmedHash);
  if (!isHex) return [];
  
  const length = trimmedHash.length;
  return COMMON_HASHES.filter((h) => h.length === length);
}
