import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function detectFileExtension(data: Uint8Array): string {
  if (data.length < 4) return "bin";

  // PNG: 89 50 4E 47
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) return "png";

  // JPEG: FF D8 FF
  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) return "jpg";

  // GIF: 47 49 46 38 (GIF87a or GIF89a)
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x38) return "gif";

  // PDF: 25 50 44 46 (%PDF)
  if (data[0] === 0x25 && data[1] === 0x50 && data[2] === 0x44 && data[3] === 0x46) return "pdf";

  // ZIP (and Office files like .docx, .xlsx): 50 4B 03 04
  if (data[0] === 0x50 && data[1] === 0x4B && data[2] === 0x03 && data[3] === 0x04) {
    // Attempt to distinguish Office files by searching for directory names in the ZIP
    // We convert a portion of the data to a string to check for signatures
    const header = String.fromCharCode(...data.slice(0, 2000));
    if (header.includes("word/")) return "docx";
    if (header.includes("xl/")) return "xlsx";
    if (header.includes("ppt/")) return "pptx";
    return "zip";
  }

  // Older Office Files (CFB): D0 CF 11 E0 A1 B1 1A E1
  if (data[0] === 0xD0 && data[1] === 0xCF && data[2] === 0x11 && data[3] === 0xE0) {
    // This is the OLE2 Compound Document Format used by .doc, .xls, .ppt
    return "doc"; // .xls and .ppt use the same header
  }

  // XML: <?xml (0x3C 0x3F 0x78 0x6D 0x6C)
  if (data[0] === 0x3C && data[1] === 0x3F && data[2] === 0x78 && data[3] === 0x6D && data[4] === 0x6C) return "xml";

  // Try to detect JSON or plain text
  const text = String.fromCharCode(...data.slice(0, 100)).trim();
  if (text.startsWith("{") || text.startsWith("[")) return "json";
  if (text.startsWith("<svg")) return "svg";
  if (text.startsWith("<!DOCTYPE html") || text.startsWith("<html")) return "html";

  // Default for text-like files (check if mostly printable)
  let printableCount = 0;
  const checkLimit = Math.min(data.length, 100);
  for (let i = 0; i < checkLimit; i++) {
    if ((data[i] >= 32 && data[i] <= 126) || data[i] === 10 || data[i] === 13 || data[i] === 9) {
      printableCount++;
    }
  }
  if (printableCount / checkLimit > 0.8) return "txt";

  return "bin";
}
