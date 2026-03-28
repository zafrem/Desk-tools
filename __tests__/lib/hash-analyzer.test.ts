import { calculateShannonEntropy, identifyHashTypes } from "../../lib/hash-analyzer";

describe("Hash Analyzer Utilities", () => {
  describe("calculateShannonEntropy", () => {
    it("should return 0 for empty string", () => {
      expect(calculateShannonEntropy("")).toBe(0);
    });

    it("should return 0 for string with single character repeated", () => {
      expect(calculateShannonEntropy("aaaaa")).toBe(0);
    });

    it("should return 1 for string with two equally distributed characters", () => {
      expect(calculateShannonEntropy("abab")).toBe(1);
    });

    it("should return expected value for a hex hash", () => {
      // 0123456789abcdef (16 unique chars) -> log2(16) = 4
      expect(calculateShannonEntropy("0123456789abcdef")).toBe(4);
    });
  });

  describe("identifyHashTypes", () => {
    it("should return empty array for non-hex strings", () => {
      expect(identifyHashTypes("not a hash")).toEqual([]);
    });

    it("should identify MD5 by length", () => {
      const md5 = "5e884898da28047151d0e56f8dc62927"; // 32 chars
      const types = identifyHashTypes(md5);
      expect(types.some(t => t.name === "MD5")).toBe(true);
    });

    it("should identify SHA-256 by length", () => {
      const sha256 = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"; // 64 chars
      const types = identifyHashTypes(sha256);
      expect(types.some(t => t.name === "SHA-256")).toBe(true);
    });

    it("should return empty array for unknown length", () => {
      expect(identifyHashTypes("abcde")).toEqual([]);
    });
  });
});
