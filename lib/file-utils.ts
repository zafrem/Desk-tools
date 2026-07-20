export const MAGIC_NUMBERS: Record<string, { ext: string; mime: string; isText: boolean }> = {
  "89504E47": { ext: "png", mime: "image/png", isText: false },
  "FFD8FF": { ext: "jpg", mime: "image/jpeg", isText: false },
  "25504446": { ext: "pdf", mime: "application/pdf", isText: false },
  "47494638": { ext: "gif", mime: "image/gif", isText: false },
  "504B0304": { ext: "zip", mime: "application/zip", isText: false },
  "7B": { ext: "json", mime: "application/json", isText: true },
  "3C": { ext: "xml", mime: "application/xml", isText: true },
};

export async function detectFileType(file: File): Promise<{ ext: string; mime: string; isText: boolean } | null> {
  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onload = (event) => {
      const arr = new Uint8Array(event.target?.result as ArrayBuffer).subarray(0, 4);
      let header = "";
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16).toUpperCase().padStart(2, "0");
      }

      for (const [magic, info] of Object.entries(MAGIC_NUMBERS)) {
        if (header.startsWith(magic)) {
          resolve(info);
          return;
        }
      }
      resolve(null);
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}

/**
 * A lightweight encoding detector based on byte-order marks (BOM)
 * and heuristic analysis of common encoding signatures.
 */
export async function detectEncoding(file: File): Promise<string> {
  const buffer = await file.slice(0, 4096).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // 1. Check for Byte Order Marks (BOM)
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) return "UTF-8";
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) return "UTF-16LE";
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) return "UTF-16BE";
  if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0xFE && bytes[3] === 0xFF) return "UTF-32BE";

  // 2. Fallback to UTF-8 validation (heuristic)
  // This is a simplified check.
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return "UTF-8";
  } catch {
    // If not UTF-8, it could be Shift-JIS, GBK, etc.
    // Without jschardet, we cannot accurately detect these.
    // We return a fallback.
    return "ISO-8859-1"; // Common fallback
  }
}
