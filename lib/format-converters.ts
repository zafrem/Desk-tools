import yaml from "js-yaml";
import Papa from "papaparse";
import convert from "xml-js";
import toml from "@iarna/toml";

export type Format = "json" | "yaml" | "csv" | "tsv" | "xml" | "toml";

export interface ConversionResult {
  success: boolean;
  output: string;
  error?: string;
}

// Parse input format to JavaScript object
function parseInput(input: string, format: Format): any {
  if (!input.trim()) {
    throw new Error("Input is empty");
  }

  switch (format) {
    case "json":
      return JSON.parse(input);

    case "yaml":
      return yaml.load(input);

    case "csv":
      const csvResult = Papa.parse(input, { header: true, skipEmptyLines: true });
      return csvResult.data;

    case "tsv":
      const tsvResult = Papa.parse(input, {
        header: true,
        delimiter: "\t",
        skipEmptyLines: true
      });
      return tsvResult.data;

    case "xml":
      const xmlResult = convert.xml2js(input, { compact: true });
      return xmlResult;

    case "toml":
      return toml.parse(input);

    default:
      throw new Error(`Unsupported input format: ${format}`);
  }
}

// Convert JavaScript object to output format
function formatOutput(data: any, format: Format, indent = 2): string {
  switch (format) {
    case "json":
      return JSON.stringify(data, null, indent);

    case "yaml":
      return yaml.dump(data, { indent });

    case "csv":
      if (!Array.isArray(data)) {
        throw new Error("CSV format requires an array of objects");
      }
      return Papa.unparse(data);

    case "tsv":
      if (!Array.isArray(data)) {
        throw new Error("TSV format requires an array of objects");
      }
      return Papa.unparse(data, { delimiter: "\t" });

    case "xml":
      const xmlOptions = {
        compact: true,
        ignoreComment: true,
        spaces: indent,
      };
      return convert.js2xml(data, xmlOptions);

    case "toml":
      return toml.stringify(data);

    default:
      throw new Error(`Unsupported output format: ${format}`);
  }
}

// Main conversion function
export function convertFormat(
  input: string,
  fromFormat: Format,
  toFormat: Format,
  indent = 2
): ConversionResult {
  try {
    // If same format, just reformat
    if (fromFormat === toFormat) {
      const data = parseInput(input, fromFormat);
      const output = formatOutput(data, toFormat, indent);
      return { success: true, output };
    }

    // Parse input
    const data = parseInput(input, fromFormat);

    // Convert to output format
    const output = formatOutput(data, toFormat, indent);

    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Conversion failed",
    };
  }
}

// Sample data for each format
export const SAMPLE_DATA: Record<Format, string> = {
  json: `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "address": {
    "city": "New York",
    "country": "USA"
  },
  "hobbies": ["reading", "coding", "music"]
}`,

  yaml: `name: John Doe
age: 30
email: john@example.com
address:
  city: New York
  country: USA
hobbies:
  - reading
  - coding
  - music`,

  csv: `name,age,email,city,country
John Doe,30,john@example.com,New York,USA
Jane Smith,25,jane@example.com,London,UK
Bob Johnson,35,bob@example.com,Tokyo,Japan`,

  tsv: `name\tage\temail\tcity\tcountry
John Doe\t30\tjohn@example.com\tNew York\tUSA
Jane Smith\t25\tjane@example.com\tLondon\tUK
Bob Johnson\t35\tbob@example.com\tTokyo\tJapan`,

  xml: `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John Doe</name>
  <age>30</age>
  <email>john@example.com</email>
  <address>
    <city>New York</city>
    <country>USA</country>
  </address>
  <hobbies>
    <hobby>reading</hobby>
    <hobby>coding</hobby>
    <hobby>music</hobby>
  </hobbies>
</person>`,

  toml: `name = "John Doe"
age = 30
email = "john@example.com"
hobbies = ["reading", "coding", "music"]

[address]
city = "New York"
country = "USA"`,
};

export const FORMAT_INFO = {
  json: {
    name: "JSON",
    ext: ".json",
    description: "Most widely used in web APIs and config files. Compatible with JavaScript.",
  },
  yaml: {
    name: "YAML",
    ext: ".yaml",
    description: "Human-readable format. Used in Docker, Kubernetes, and CI/CD configs.",
  },
  csv: {
    name: "CSV",
    ext: ".csv",
    description: "Tabular data format. Used for Excel and database import/export.",
  },
  tsv: {
    name: "TSV",
    ext: ".tsv",
    description: "Tab-separated values. Similar to CSV but uses tabs as delimiters.",
  },
  xml: {
    name: "XML",
    ext: ".xml",
    description: "Structured document format. Used in SOAP APIs and legacy systems.",
  },
  toml: {
    name: "TOML",
    ext: ".toml",
    description: "Config file format. Used in Rust Cargo and Python pyproject.toml.",
  },
};
