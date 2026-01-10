import * as prettier from "prettier/standalone";
import type { Options } from "prettier";
import * as parserBabel from "prettier/plugins/babel";
// estree is used internally by babel/typescript parsers, imported for bundling
import "prettier/plugins/estree";
import * as parserTypescript from "prettier/plugins/typescript";
import * as parserHtml from "prettier/plugins/html";
import * as parserCss from "prettier/plugins/postcss";
import * as parserMarkdown from "prettier/plugins/markdown";
import * as parserYaml from "prettier/plugins/yaml";

export type Language =
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "json"
  | "html"
  | "css"
  | "scss"
  | "less"
  | "markdown"
  | "yaml"
  | "graphql"
  | "python";

export interface FormatResult {
  success: boolean;
  formatted: string;
  error?: string;
}

export interface FormatOptions {
  printWidth?: number;
  tabWidth?: number;
  useTabs?: boolean;
  semi?: boolean;
  singleQuote?: boolean;
  trailingComma?: "none" | "es5" | "all";
  bracketSpacing?: boolean;
  arrowParens?: "avoid" | "always";
}

const PARSER_MAP: Partial<Record<Language, string>> = {
  javascript: "babel",
  typescript: "typescript",
  jsx: "babel",
  tsx: "typescript",
  json: "json",
  html: "html",
  css: "css",
  scss: "scss",
  less: "less",
  markdown: "markdown",
  yaml: "yaml",
  graphql: "graphql",
  // python uses custom formatter, not Prettier
};

export const LANGUAGE_INFO: Record<Language, { name: string; ext: string }> = {
  javascript: { name: "JavaScript", ext: ".js" },
  typescript: { name: "TypeScript", ext: ".ts" },
  jsx: { name: "React JSX", ext: ".jsx" },
  tsx: { name: "React TSX", ext: ".tsx" },
  json: { name: "JSON", ext: ".json" },
  html: { name: "HTML", ext: ".html" },
  css: { name: "CSS", ext: ".css" },
  scss: { name: "SCSS", ext: ".scss" },
  less: { name: "Less", ext: ".less" },
  markdown: { name: "Markdown", ext: ".md" },
  yaml: { name: "YAML", ext: ".yaml" },
  graphql: { name: "GraphQL", ext: ".graphql" },
  python: { name: "Python", ext: ".py" },
};

// Simple Python formatter
function formatPython(code: string, tabWidth: number): string {
  const lines = code.split('\n');
  const formatted: string[] = [];
  let indentLevel = 0;
  const indent = ' '.repeat(tabWidth);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      formatted.push('');
      continue;
    }

    // Decrease indent for lines starting with dedent keywords
    if (trimmed.match(/^(elif |else:|except |except:|finally:|return |break|continue|pass)/)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Add current line with proper indentation
    formatted.push(indent.repeat(indentLevel) + trimmed);

    // Increase indent after colon (function, class, if, for, while, etc.)
    if (trimmed.endsWith(':')) {
      indentLevel++;
    }

    // Reset indent to 0 for top-level statements
    if (trimmed.match(/^(class |def |@\w+|import |from )/)) {
      if (!trimmed.endsWith(':')) {
        indentLevel = 0;
      } else {
        indentLevel = 1;
      }
    }
  }

  return formatted.join('\n');
}

export async function formatCode(
  code: string,
  language: Language,
  options: FormatOptions = {}
): Promise<FormatResult> {
  try {
    if (!code.trim()) {
      return {
        success: false,
        formatted: "",
        error: "Code is empty",
      };
    }

    // Use custom formatter for Python
    if (language === "python") {
      const tabWidth = options.tabWidth ?? 4; // Python standard is 4 spaces
      const formatted = formatPython(code, tabWidth);
      return {
        success: true,
        formatted,
      };
    }

    const parser = PARSER_MAP[language];
    if (!parser) {
      return {
        success: false,
        formatted: "",
        error: `Unsupported language: ${language}`,
      };
    }

    const prettierOptions: Options = {
      parser,
      plugins: [
        parserBabel,
        parserTypescript,
        parserHtml,
        parserCss,
        parserMarkdown,
        parserYaml,
      ],
      printWidth: options.printWidth ?? 80,
      tabWidth: options.tabWidth ?? 2,
      useTabs: options.useTabs ?? false,
      semi: options.semi ?? true,
      singleQuote: options.singleQuote ?? false,
      trailingComma: options.trailingComma ?? "es5",
      bracketSpacing: options.bracketSpacing ?? true,
      arrowParens: options.arrowParens ?? "always",
    };

    const formatted = await prettier.format(code, prettierOptions);

    return {
      success: true,
      formatted,
    };
  } catch (error) {
    return {
      success: false,
      formatted: "",
      error: error instanceof Error ? error.message : "Formatting failed",
    };
  }
}

export const SAMPLE_CODE: Record<Language, string> = {
  javascript: `function calculateSum(a,b){return a+b;}
const result=calculateSum(5,10);
console.log("Result:",result);`,

  typescript: `interface User{name:string;age:number;}
function greet(user:User):string{return \`Hello, \${user.name}!\`;}
const user:User={name:"John",age:30};`,

  jsx: `import React from 'react';
function Button({onClick,children}){return <button onClick={onClick} className="btn">{children}</button>;}
export default Button;`,

  tsx: `import React from 'react';
interface Props{onClick:()=>void;children:React.ReactNode;}
const Button:React.FC<Props>=({onClick,children})=>{return <button onClick={onClick}>{children}</button>;};`,

  json: `{"name":"John Doe","age":30,"email":"john@example.com","address":{"city":"New York","country":"USA"},"hobbies":["reading","coding"]}`,

  html: `<!DOCTYPE html><html><head><title>Test</title></head><body><div class="container"><h1>Hello World</h1><p>This is a test.</p></div></body></html>`,

  css: `.container{display:flex;flex-direction:column;padding:20px;background-color:#f0f0f0;}
.button{border:none;padding:10px 20px;cursor:pointer;}`,

  scss: `$primary-color:#007bff;
.container{padding:20px;
.button{background-color:$primary-color;&:hover{opacity:0.8;}}}`,

  less: `@primary-color:#007bff;
.container{padding:20px;
.button{background-color:@primary-color;&:hover{opacity:0.8;}}}`,

  markdown: `# Heading 1
## Heading 2
This is a paragraph with **bold** and *italic* text.
- Item 1
- Item 2
\`\`\`javascript
const x = 10;
\`\`\``,

  yaml: `name: John Doe
age: 30
address:
  city: New York
  country: USA
hobbies:
  - reading
  - coding`,

  graphql: `query GetUser($id:ID!){user(id:$id){id name email posts{id title}}}`,

  python: `def calculate_sum(a,b):
return a+b
class User:
def __init__(self,name,age):
self.name=name
self.age=age
def greet(self):
return f"Hello, {self.name}!"
if __name__=="__main__":
result=calculate_sum(5,10)
print(f"Result: {result}")`,
};
