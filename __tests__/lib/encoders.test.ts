import {
  toBase64,
  fromBase64,
  toBase32,
  fromBase32,
  toURLEncoded,
  fromURLEncoded,
  toHTMLEscape,
  fromHTMLEscape,
  toHTMLEntity,
  toHexString,
  fromHexString,
  toBinaryString,
  fromBinaryString,
  toUpperCase,
  toLowerCase,
  toSwapCase,
  toCapitalize,
  toAlternating,
  toUpperCamelCase,
  toLowerCamelCase,
  toUpperSnakeCase,
  toLowerSnakeCase,
  toUpperKebabCase,
  toLowerKebabCase,
  toInitials,
  toReverse,
  toROT13,
  toROT47,
  toAtbash,
  toCaesar,
  toMorse,
  fromMorse,
  safeEncode,
  safeDecode,
} from "@/lib/encoders";

describe("encoders", () => {
  describe("safeEncode/safeDecode", () => {
    it("should return result on success", () => {
      expect(safeEncode(() => "success")).toBe("success");
      expect(safeDecode(() => "success")).toBe("success");
    });

    it("should return fallback on error", () => {
      expect(safeEncode(() => { throw new Error(); })).toBe("[Encoding Error]");
      expect(safeDecode(() => { throw new Error(); })).toBe("[Decoding Error]");
    });

    it("should return fallback on empty result for safeDecode", () => {
      expect(safeDecode(() => "")).toBe("[Decoding Error]");
    });
  });

  describe("Base64", () => {
    it("should encode to Base64", () => {
      expect(toBase64("Hello")).toBe("SGVsbG8=");
      expect(toBase64("Hello World")).toBe("SGVsbG8gV29ybGQ=");
    });

    it("should decode from Base64", () => {
      expect(fromBase64("SGVsbG8=")).toBe("Hello");
      expect(fromBase64("SGVsbG8gV29ybGQ=")).toBe("Hello World");
    });

    it("should handle empty string", () => {
      expect(toBase64("")).toBe("");
      expect(fromBase64("")).toBe("[Decoding Error]");
    });
  });

  describe("Base32", () => {
    it("should encode to Base32", () => {
      expect(toBase32("Hello")).toBe("JBSWY3DP");
    });

    it("should decode from Base32", () => {
      expect(fromBase32("JBSWY3DP")).toBe("Hello");
    });

    it("should handle case insensitive decode", () => {
      expect(fromBase32("jbswy3dp")).toBe("Hello");
    });
  });

  describe("URL Encoding", () => {
    it("should encode URL special characters", () => {
      expect(toURLEncoded("Hello World")).toBe("Hello%20World");
      expect(toURLEncoded("test?foo=bar&baz=qux")).toBe("test%3Ffoo%3Dbar%26baz%3Dqux");
    });

    it("should decode URL encoded strings", () => {
      expect(fromURLEncoded("Hello%20World")).toBe("Hello World");
      expect(fromURLEncoded("test%3Ffoo%3Dbar")).toBe("test?foo=bar");
    });
  });

  describe("HTML Escape", () => {
    it("should escape HTML special characters", () => {
      expect(toHTMLEscape("<div>")).toBe("&lt;div&gt;");
      expect(toHTMLEscape('"test"')).toBe("&quot;test&quot;");
      expect(toHTMLEscape("a & b")).toBe("a &amp; b");
    });

    it("should unescape HTML entities", () => {
      expect(fromHTMLEscape("&lt;div&gt;")).toBe("<div>");
      expect(fromHTMLEscape("&quot;test&quot;")).toBe('"test"');
      expect(fromHTMLEscape("a &amp; b")).toBe("a & b");
    });
  });

  describe("HTML Entity", () => {
    it("should convert to HTML entities", () => {
      expect(toHTMLEntity("A")).toBe("&#65;");
      expect(toHTMLEntity("AB")).toBe("&#65;&#66;");
    });
  });

  describe("Hex String", () => {
    it("should convert to hex string", () => {
      expect(toHexString("A")).toBe("41");
      expect(toHexString("AB")).toBe("41 42");
    });

    it("should convert from hex string", () => {
      expect(fromHexString("41")).toBe("A");
      expect(fromHexString("41 42")).toBe("AB");
    });
  });

  describe("Binary String", () => {
    it("should convert to binary string", () => {
      expect(toBinaryString("A")).toBe("01000001");
      expect(toBinaryString("AB")).toBe("01000001 01000010");
    });

    it("should convert from binary string", () => {
      expect(fromBinaryString("01000001")).toBe("A");
      expect(fromBinaryString("01000001 01000010")).toBe("AB");
    });
  });

  describe("String Cases", () => {
    it("should convert to uppercase", () => {
      expect(toUpperCase("hello")).toBe("HELLO");
    });

    it("should convert to lowercase", () => {
      expect(toLowerCase("HELLO")).toBe("hello");
    });

    it("should swap case", () => {
      expect(toSwapCase("HeLLo")).toBe("hEllO");
    });

    it("should capitalize", () => {
      expect(toCapitalize("hELLO")).toBe("Hello");
    });

    it("should alternate case", () => {
      expect(toAlternating("hello")).toBe("HeLlO");
    });

    it("should convert to UpperCamelCase", () => {
      expect(toUpperCamelCase("hello world")).toBe("HelloWorld");
      expect(toUpperCamelCase("hello-world")).toBe("HelloWorld");
      expect(toUpperCamelCase("hello_world")).toBe("HelloWorld");
    });

    it("should convert to lowerCamelCase", () => {
      expect(toLowerCamelCase("hello world")).toBe("helloWorld");
    });

    it("should convert to UPPER_SNAKE_CASE", () => {
      expect(toUpperSnakeCase("hello world")).toBe("HELLO_WORLD");
    });

    it("should convert to lower_snake_case", () => {
      expect(toLowerSnakeCase("hello world")).toBe("hello_world");
    });

    it("should convert to UPPER-KEBAB-CASE", () => {
      expect(toUpperKebabCase("hello world")).toBe("HELLO-WORLD");
    });

    it("should convert to lower-kebab-case", () => {
      expect(toLowerKebabCase("hello world")).toBe("hello-world");
    });

    it("should extract initials", () => {
      expect(toInitials("Hello World")).toBe("HW");
      expect(toInitials("John Doe Smith")).toBe("JDS");
    });

    it("should reverse string", () => {
      expect(toReverse("Hello")).toBe("olleH");
    });
  });

  describe("Ciphers", () => {
    it("should apply ROT13", () => {
      expect(toROT13("Hello")).toBe("Uryyb");
      expect(toROT13("Uryyb")).toBe("Hello"); // ROT13 is self-inverse
    });

    it("should apply ROT47", () => {
      expect(toROT47("Hello!")).toBe("w6==@P");
    });

    it("should apply Atbash", () => {
      expect(toAtbash("ABC")).toBe("ZYX");
      expect(toAtbash("ZYX")).toBe("ABC"); // Atbash is self-inverse
    });

    it("should apply Caesar cipher", () => {
      expect(toCaesar("ABC", 3)).toBe("DEF");
      expect(toCaesar("DEF", -3)).toBe("ABC");
      expect(toCaesar("XYZ", 3)).toBe("ABC"); // Should wrap around
    });
  });

  describe("Morse Code", () => {
    it("should convert to Morse code", () => {
      expect(toMorse("SOS")).toBe("... --- ...");
      expect(toMorse("HELLO")).toBe(".... . .-.. .-.. ---");
    });

    it("should convert from Morse code", () => {
      expect(fromMorse("... --- ...")).toBe("SOS");
      expect(fromMorse(".... . .-.. .-.. ---")).toBe("HELLO");
    });

    it("should handle spaces", () => {
      expect(toMorse("A B")).toBe(".- / -...");
    });
  });
});
