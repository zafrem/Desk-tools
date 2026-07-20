import CryptoJS from "crypto-js";

export const safeEncode = (fn: () => string, fallback = "[Encoding Error]"): string => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const safeDecode = (fn: () => string, fallback = "[Decoding Error]"): string => {
  try {
    const result = fn();
    return result || fallback;
  } catch {
    return fallback;
  }
};

// Base64 (UTF-8 support)
export const toBase64 = (str: string) => 
  safeEncode(() => {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  });

export const fromBase64 = (str: string) => 
  safeDecode(() => {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  });

// Base32 (UTF-8 support)
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const toBase32 = (str: string): string => {
  return safeEncode(() => {
    const bytes = new TextEncoder().encode(str);
    let bits = "";
    for (let i = 0; i < bytes.length; i++) {
      bits += bytes[i].toString(2).padStart(8, "0");
    }
    let result = "";
    for (let i = 0; i < bits.length; i += 5) {
      const chunk = bits.substr(i, 5).padEnd(5, "0");
      result += BASE32_CHARS[parseInt(chunk, 2)];
    }
    return result.padEnd(Math.ceil(result.length / 8) * 8, "=");
  });
};

export const fromBase32 = (str: string): string => {
  return safeDecode(() => {
    str = str.toUpperCase().replace(/=+$/, "");
    let bits = "";
    for (let i = 0; i < str.length; i++) {
      const val = BASE32_CHARS.indexOf(str[i]);
      if (val === -1) throw new Error("Invalid Base32");
      bits += val.toString(2).padStart(5, "0");
    }
    const byteList = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.substr(i, 8);
      if (byte.length === 8) {
        byteList.push(parseInt(byte, 2));
      }
    }
    return new TextDecoder().decode(new Uint8Array(byteList));
  });
};

// URL Encoding
export const toURLEncoded = (str: string) => safeEncode(() => encodeURIComponent(str));
export const fromURLEncoded = (str: string) => safeDecode(() => decodeURIComponent(str));

// HTML Escape
export const toHTMLEscape = (str: string) =>
  safeEncode(() =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  );

export const fromHTMLEscape = (str: string) =>
  safeDecode(() =>
    str
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
  );

// HTML Entity (UTF-8 / Surrogate Pair support)
export const toHTMLEntity = (str: string) =>
  safeEncode(() => Array.from(str).map((c) => `&#${c.codePointAt(0)};`).join(""));

// Hex String (UTF-8 support)
export const toHexString = (str: string) =>
  safeEncode(() => {
    const bytes = new TextEncoder().encode(str);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(" ");
  });

export const fromHexString = (str: string) =>
  safeDecode(() => {
    const hex = str.replace(/\s/g, "");
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return new TextDecoder().decode(bytes);
  });

// Binary String (UTF-8 support)
export const toBinaryString = (str: string) =>
  safeEncode(() => {
    const bytes = new TextEncoder().encode(str);
    return Array.from(bytes).map((b) => b.toString(2).padStart(8, "0")).join(" ");
  });

export const fromBinaryString = (str: string) =>
  safeDecode(() => {
    const binary = str.replace(/\s/g, "");
    const bytes = new Uint8Array(binary.length / 8);
    for (let i = 0; i < binary.length; i += 8) {
      bytes[i / 8] = parseInt(binary.substr(i, 8), 2);
    }
    return new TextDecoder().decode(bytes);
  });

// String cases
export const toUpperCase = (str: string) => str.toUpperCase();
export const toLowerCase = (str: string) => str.toLowerCase();
export const toSwapCase = (str: string) =>
  str
    .split("")
    .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
    .join("");
export const toCapitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
export const toAlternating = (str: string) =>
  str
    .split("")
    .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
    .join("");
export const toUpperCamelCase = (str: string) =>
  str
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
export const toLowerCamelCase = (str: string) => {
  const camel = toUpperCamelCase(str);
  return camel.charAt(0).toLowerCase() + camel.slice(1);
};
export const toUpperSnakeCase = (str: string) => str.replace(/[\s-]+/g, "_").toUpperCase();
export const toLowerSnakeCase = (str: string) => str.replace(/[\s-]+/g, "_").toLowerCase();
export const toUpperKebabCase = (str: string) => str.replace(/[\s_]+/g, "-").toUpperCase();
export const toLowerKebabCase = (str: string) => str.replace(/[\s_]+/g, "-").toLowerCase();
export const toInitials = (str: string) =>
  str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
export const toReverse = (str: string) => Array.from(str).reverse().join("");

// Ciphers
export const toROT13 = (str: string) =>
  str.replace(/[A-Za-z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });

export const toROT18 = (str: string) =>
  str
    .replace(/[A-Za-z]/g, (c) => {
      const base = c <= "Z" ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    })
    .replace(/[0-9]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 48 + 5) % 10) + 48));

export const toROT47 = (str: string) =>
  str.replace(/[!-~]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 33 + 47) % 94) + 33));

export const toAtbash = (str: string) =>
  str.replace(/[A-Za-z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(25 - (c.charCodeAt(0) - base) + base);
  });

export const toCaesar = (str: string, shift: number) =>
  str.replace(/[A-Za-z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
  });

// Morse Code
const MORSE_MAP: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
  "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  " ": "/",
};

export const toMorse = (str: string) =>
  safeEncode(() =>
    str
      .toUpperCase()
      .split("")
      .map((c) => MORSE_MAP[c] || c)
      .join(" ")
  );

export const fromMorse = (str: string) =>
  safeDecode(() => {
    const reverseMap = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]));
    return str
      .split(" ")
      .map((code) => reverseMap[code] || "")
      .join("");
  });

// Hash functions
export const toMD5 = (str: string) => CryptoJS.MD5(str).toString();
export const toSHA1 = (str: string) => CryptoJS.SHA1(str).toString();
export const toSHA256 = (str: string) => CryptoJS.SHA256(str).toString();
export const toSHA384 = (str: string) => CryptoJS.SHA384(str).toString();
export const toSHA512 = (str: string) => CryptoJS.SHA512(str).toString();
