export interface Tool {
  id: string;
  name: string;
  description: string;
  tags: string[];
  category: 'encoder' | 'converter' | 'formatter' | 'generator' | 'calculator' | 'designer' | 'security' | 'developer' | 'ai' | 'other';
  path: string; // URL path to the tool page
  icon?: string; // Optional icon name from lucide-react
  subTools?: {
    id: string;
    name: string;
    path: string;
    icon?: string;
  }[];
}

export type ToolCategory = Tool['category'];
