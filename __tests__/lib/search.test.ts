import { searchTools, getToolById, getToolsByCategory } from "@/lib/search";
import { TOOLS_REGISTRY } from "@/lib/tools-registry";

describe("search", () => {
  describe("searchTools", () => {
    it("should return all tools sorted alphabetically when query is empty", () => {
      const results = searchTools("");
      expect(results.length).toBe(TOOLS_REGISTRY.length);

      // Check alphabetical order
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].name.localeCompare(results[i].name)).toBeLessThanOrEqual(0);
      }
    });

    it("should return all tools when query is whitespace", () => {
      const results = searchTools("   ");
      expect(results.length).toBe(TOOLS_REGISTRY.length);
    });

    it("should find tools by name", () => {
      const results = searchTools("json");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((t) => t.name.toLowerCase().includes("json"))).toBe(true);
    });

    it("should find tools by tag", () => {
      const results = searchTools("encode");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should find tools by category", () => {
      const results = searchTools("security");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should handle fuzzy matching", () => {
      const results = searchTools("pasword"); // typo
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("getToolById", () => {
    it("should return tool when id exists", () => {
      const tool = getToolById("text-encoder");
      expect(tool).toBeDefined();
      expect(tool?.id).toBe("text-encoder");
      expect(tool?.name).toBe("Text Encoder");
    });

    it("should return undefined when id does not exist", () => {
      const tool = getToolById("non-existent-tool");
      expect(tool).toBeUndefined();
    });
  });

  describe("getToolsByCategory", () => {
    it("should return tools filtered by category", () => {
      const encoderTools = getToolsByCategory("encoder");
      expect(encoderTools.length).toBeGreaterThan(0);
      expect(encoderTools.every((t) => t.category === "encoder")).toBe(true);
    });

    it("should return empty array for non-existent category", () => {
      // @ts-expect-error Testing invalid category
      const tools = getToolsByCategory("invalid-category");
      expect(tools).toEqual([]);
    });

    it("should return security tools", () => {
      const securityTools = getToolsByCategory("security");
      expect(securityTools.length).toBeGreaterThan(0);
      expect(securityTools.some((t) => t.id === "jwt-decoder")).toBe(true);
    });

    it("should return designer tools", () => {
      const designerTools = getToolsByCategory("designer");
      expect(designerTools.length).toBeGreaterThan(0);
    });
  });
});
