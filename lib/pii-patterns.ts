export interface PiiPattern {
  label: string;
  pattern: string;
  example: string;
}

export const PII_PATTERNS: PiiPattern[] = [
  { label: "Spain Phone", pattern: "(?:(?:\\+|00)34\\s?)?[67]\\d{8}", example: "+34 612345678" },
  { label: "Spain ID", pattern: "\\d{8}[A-Z]", example: "12345678A" },
  { label: "China Phone", pattern: "1[3-9][0-9]-?[0-9]{4}-?[0-9]{4}", example: "138-1234-5678" },
  { label: "China ID", pattern: "[0-9]{17}[0-9X]", example: "110105199001011234" },
  { label: "France Phone", pattern: "0[1-9]\\d{8}", example: "0123456789" },
  { label: "Korea Phone", pattern: "01[01679][ -]?[0-9]{3,4}[ -]?[0-9]{4}", example: "010-1234-5678" },
  { label: "Korea RRN", pattern: "[0-9]{2}[01][0-9][0-3][0-9]-?[1-4][0-9]{6}", example: "900101-1234567" },
  { label: "US SSN", pattern: "[0-9]{3}-?[0-9]{2}-?[0-9]{4}", example: "123-45-6789" },
  { label: "Credit Card (Visa)", pattern: "4[0-9]{12}(?:[0-9]{3})?", example: "4111222233334444" },
  { label: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\\.[a-zA-Z]{2,}", example: "example@email.com" },
];
