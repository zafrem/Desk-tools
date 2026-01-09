import Fuse, { IFuseOptions } from "fuse.js";
import { Tool } from "@/types/tool";
import { TOOLS_REGISTRY } from "./tools-registry";

// Configure Fuse.js for fuzzy search
const fuseOptions: IFuseOptions<Tool> = {
  keys: [
    { name: "name", weight: 2 },
    { name: "tags", weight: 1.5 },
    { name: "description", weight: 1 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

const fuse = new Fuse(TOOLS_REGISTRY, fuseOptions);

export const searchTools = (query: string): Tool[] => {
  if (!query || query.trim().length === 0) {
    return TOOLS_REGISTRY;
  }

  const results = fuse.search(query);
  return results.map((result) => result.item);
};

export const getToolById = (id: string): Tool | undefined => {
  return TOOLS_REGISTRY.find((tool) => tool.id === id);
};

export const getToolsByCategory = (category: Tool["category"]): Tool[] => {
  return TOOLS_REGISTRY.filter((tool) => tool.category === category);
};
