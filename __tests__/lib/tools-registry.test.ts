import { TOOLS_REGISTRY } from "@/lib/tools-registry";

describe("tools-registry", () => {
  it("should have tools registered", () => {
    expect(TOOLS_REGISTRY.length).toBeGreaterThan(0);
  });

  it("should have unique tool ids", () => {
    const ids = TOOLS_REGISTRY.map((tool) => tool.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have unique tool paths", () => {
    const paths = TOOLS_REGISTRY.map((tool) => tool.path);
    const uniquePaths = new Set(paths);
    expect(uniquePaths.size).toBe(paths.length);
  });

  it("should have valid categories", () => {
    const validCategories = [
      "encoder",
      "converter",
      "formatter",
      "generator",
      "calculator",
      "designer",
      "security",
      "developer",
      "other",
    ];

    TOOLS_REGISTRY.forEach((tool) => {
      expect(validCategories).toContain(tool.category);
    });
  });

  it("should have path matching id", () => {
    TOOLS_REGISTRY.forEach((tool) => {
      expect(tool.path).toBe(`/tools/${tool.id}`);
    });
  });

  it("should have required fields for each tool", () => {
    TOOLS_REGISTRY.forEach((tool) => {
      expect(tool.id).toBeDefined();
      expect(tool.id.length).toBeGreaterThan(0);
      expect(tool.name).toBeDefined();
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.description).toBeDefined();
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.tags).toBeDefined();
      expect(Array.isArray(tool.tags)).toBe(true);
      expect(tool.tags.length).toBeGreaterThan(0);
      expect(tool.category).toBeDefined();
      expect(tool.path).toBeDefined();
    });
  });

  it("should have tags as non-empty array", () => {
    TOOLS_REGISTRY.forEach((tool) => {
      expect(tool.tags.length).toBeGreaterThan(0);
      tool.tags.forEach((tag) => {
        expect(typeof tag).toBe("string");
        expect(tag.length).toBeGreaterThan(0);
      });
    });
  });

  describe("specific tools", () => {
    it("should have text-encoder tool", () => {
      const tool = TOOLS_REGISTRY.find((t) => t.id === "text-encoder");
      expect(tool).toBeDefined();
      expect(tool?.category).toBe("encoder");
    });

    it("should have background-remover tool", () => {
      const tool = TOOLS_REGISTRY.find((t) => t.id === "background-remover");
      expect(tool).toBeDefined();
      expect(tool?.category).toBe("designer");
    });

    it("should have jwt-decoder tool", () => {
      const tool = TOOLS_REGISTRY.find((t) => t.id === "jwt-decoder");
      expect(tool).toBeDefined();
      expect(tool?.category).toBe("security");
    });
  });
});
