export interface Tool {
  id: string;
  name: string;
  description: string;
  tags: string[];
  category: 'encoder' | 'converter' | 'formatter' | 'generator' | 'calculator' | 'designer' | 'security' | 'developer' | 'other';
  path: string; // URL path to the tool page
  icon?: string; // Optional icon name from lucide-react
}

export type ToolCategory = Tool['category'];
