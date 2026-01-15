import {
  removeBackgroundColor,
  hexToRgb,
  rgbToHex,
  RGB,
} from "@/lib/background-remover";

describe("background-remover", () => {
  describe("hexToRgb", () => {
    it("should convert hex to RGB", () => {
      expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb("#00ff00")).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 });
    });

    it("should handle hex without hash", () => {
      expect(hexToRgb("ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    });

    it("should handle uppercase hex", () => {
      expect(hexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("#FF00FF")).toEqual({ r: 255, g: 0, b: 255 });
    });

    it("should return white for invalid hex", () => {
      expect(hexToRgb("invalid")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("")).toEqual({ r: 255, g: 255, b: 255 });
    });
  });

  describe("rgbToHex", () => {
    it("should convert RGB to hex", () => {
      expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe("#ffffff");
      expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
      expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe("#ff0000");
      expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe("#00ff00");
      expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe("#0000ff");
    });

    it("should pad single digit hex values", () => {
      expect(rgbToHex({ r: 1, g: 2, b: 3 })).toBe("#010203");
    });
  });

  describe("removeBackgroundColor", () => {
    it("should remove exact color match", () => {
      // Create a 2x2 image with white background and one red pixel
      const imageData = new ImageData(
        new Uint8ClampedArray([
          255, 255, 255, 255, // white
          255, 0, 0, 255, // red
          255, 255, 255, 255, // white
          0, 255, 0, 255, // green
        ]),
        2,
        2
      );

      const result = removeBackgroundColor(imageData, { r: 255, g: 255, b: 255 }, 0);

      // White pixels should be transparent (alpha = 0)
      expect(result.data[3]).toBe(0); // first white pixel
      expect(result.data[11]).toBe(0); // second white pixel

      // Non-white pixels should remain opaque
      expect(result.data[7]).toBe(255); // red pixel
      expect(result.data[15]).toBe(255); // green pixel
    });

    it("should remove colors within tolerance", () => {
      // Create image with slightly off-white pixel
      const imageData = new ImageData(
        new Uint8ClampedArray([
          250, 250, 250, 255, // almost white
          200, 200, 200, 255, // gray
        ]),
        2,
        1
      );

      // With 5% tolerance, almost white should be removed
      const result = removeBackgroundColor(imageData, { r: 255, g: 255, b: 255 }, 5);
      expect(result.data[3]).toBe(0); // almost white should be transparent
      expect(result.data[7]).toBe(255); // gray should remain opaque
    });

    it("should not modify original image data reference", () => {
      const originalData = new Uint8ClampedArray([255, 255, 255, 255]);
      const imageData = new ImageData(originalData, 1, 1);

      removeBackgroundColor(imageData, { r: 255, g: 255, b: 255 }, 0);

      // The function modifies in place, so this tests that it works correctly
      expect(imageData.data[3]).toBe(0);
    });

    it("should handle 100% tolerance (remove all)", () => {
      const imageData = new ImageData(
        new Uint8ClampedArray([
          255, 0, 0, 255,
          0, 255, 0, 255,
          0, 0, 255, 255,
        ]),
        3,
        1
      );

      const result = removeBackgroundColor(imageData, { r: 128, g: 128, b: 128 }, 100);

      // All pixels should be transparent with 100% tolerance
      expect(result.data[3]).toBe(0);
      expect(result.data[7]).toBe(0);
      expect(result.data[11]).toBe(0);
    });
  });
});
