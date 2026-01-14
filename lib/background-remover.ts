import { parseGIF, decompressFrames, ParsedFrame } from "gifuct-js";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ProcessedFrame {
  imageData: ImageData;
  delay: number;
}

/**
 * Remove a specific color from ImageData, making it transparent
 */
export function removeBackgroundColor(
  imageData: ImageData,
  targetColor: RGB,
  tolerance: number
): ImageData {
  const data = imageData.data;
  const maxDistance = 441.67; // sqrt(255^2 + 255^2 + 255^2)
  const toleranceDistance = (tolerance / 100) * maxDistance;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const distance = Math.sqrt(
      Math.pow(r - targetColor.r, 2) +
        Math.pow(g - targetColor.g, 2) +
        Math.pow(b - targetColor.b, 2)
    );

    if (distance <= toleranceDistance) {
      data[i + 3] = 0; // Set alpha to 0 (transparent)
    }
  }

  return imageData;
}

/**
 * Parse a GIF file into individual frames
 */
export async function parseGifFrames(
  arrayBuffer: ArrayBuffer
): Promise<{ frames: ParsedFrame[]; width: number; height: number }> {
  const gif = parseGIF(arrayBuffer);
  const frames = decompressFrames(gif, true);

  if (frames.length === 0) {
    throw new Error("No frames found in GIF");
  }

  // Get dimensions from the first frame or GIF header
  const width = gif.lsd.width;
  const height = gif.lsd.height;

  return { frames, width, height };
}

/**
 * Convert a parsed GIF frame to ImageData
 */
export function frameToImageData(
  frame: ParsedFrame,
  width: number,
  height: number,
  previousImageData?: ImageData
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // If we have previous image data, draw it first (for cumulative frames)
  if (previousImageData) {
    ctx.putImageData(previousImageData, 0, 0);
  }

  // Create ImageData from frame patch
  const frameImageData = ctx.createImageData(frame.dims.width, frame.dims.height);
  frameImageData.data.set(frame.patch);

  // Draw the frame at its position
  ctx.putImageData(frameImageData, frame.dims.left, frame.dims.top);

  return ctx.getImageData(0, 0, width, height);
}

/**
 * Hex color string to RGB object
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 255, g: 255, b: 255 }; // Default to white
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * RGB object to hex color string
 */
export function rgbToHex(rgb: RGB): string {
  return (
    "#" +
    [rgb.r, rgb.g, rgb.b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

/**
 * Get the color at a specific pixel position from a canvas
 */
export function getPixelColor(
  canvas: HTMLCanvasElement,
  x: number,
  y: number
): RGB {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { r: 255, g: 255, b: 255 };

  const pixel = ctx.getImageData(x, y, 1, 1).data;
  return {
    r: pixel[0],
    g: pixel[1],
    b: pixel[2],
  };
}
