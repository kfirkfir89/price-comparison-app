/**
 * String manipulation and normalization utilities
 */

/**
 * Normalize text for comparison
 * - Converts to lowercase
 * - Removes extra whitespace
 * - Removes special characters
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/[^\w\s-]/g, ""); // Remove special characters except hyphens
}

/**
 * Create a URL-friendly slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Truncate text to a maximum length
 */
export function truncate(
  text: string,
  maxLength: number,
  suffix = "...",
): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Capitalize first letter only
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Remove HTML tags from string
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Extract numbers from string
 */
export function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+\.?\d*/g);
  return matches ? matches.map(Number) : [];
}

/**
 * Check if string contains any of the keywords
 */
export function containsAnyKeyword(text: string, keywords: string[]): boolean {
  const normalizedText = normalizeText(text);
  return keywords.some((keyword) =>
    normalizedText.includes(normalizeText(keyword)),
  );
}

/**
 * Check if string contains all keywords
 */
export function containsAllKeywords(text: string, keywords: string[]): boolean {
  const normalizedText = normalizeText(text);
  return keywords.every((keyword) =>
    normalizedText.includes(normalizeText(keyword)),
  );
}

/**
 * Generate a random string
 */
export function randomString(length = 10): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sanitize string for use in filenames
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Remove diacritics/accents from string
 */
export function removeDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Escape special regex characters
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlight search terms in text
 */
export function highlightText(
  text: string,
  searchTerm: string,
  highlightTag = "mark",
): string {
  if (!searchTerm) return text;

  const escapedTerm = escapeRegex(searchTerm);
  const regex = new RegExp(`(${escapedTerm})`, "gi");

  return text.replace(regex, `<${highlightTag}>$1</${highlightTag}>`);
}

/**
 * Calculate string similarity (Levenshtein distance)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }

  const maxLength = Math.max(s1.length, s2.length);
  const similarity = maxLength === 0 ? 1 : 1 - costs[s2.length] / maxLength;

  return Math.round(similarity * 100) / 100;
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return "";
  }
}

/**
 * Pluralize a word
 */
export function pluralize(
  word: string,
  count: number,
  plural?: string,
): string {
  if (count === 1) {
    return word;
  }

  return plural || `${word}s`;
}

/**
 * Format number with suffix (1K, 1M, etc.)
 */
export function formatNumberWithSuffix(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
