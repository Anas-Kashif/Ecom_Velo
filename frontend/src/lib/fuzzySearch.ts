/**
 * Fuzzy Search Utility
 * Implements a simple but effective fuzzy string matching algorithm
 */

export interface FuzzySearchResult<T> {
  item: T;
  score: number;
  matches: { start: number; end: number }[];
}

/**
 * Calculate the similarity score between a string and a query using fuzzy matching
 * @param str The string to search in
 * @param query The search query
 * @returns Score between 0 and 1, where 1 is a perfect match
 */
function fuzzyMatch(str: string, query: string): number {
  const strLower = str.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match gets highest score
  if (strLower === queryLower) return 1;
  
  // Starts with query gets high score
  if (strLower.startsWith(queryLower)) return 0.9;

  // Contains query as substring gets good score
  if (strLower.includes(queryLower)) return 0.8;

  // Fuzzy matching: calculate how well characters match in order
  let queryIdx = 0;
  let strIdx = 0;
  let score = 0;

  while (queryIdx < queryLower.length && strIdx < strLower.length) {
    if (queryLower[queryIdx] === strLower[strIdx]) {
      score++;
      queryIdx++;
    }
    strIdx++;
  }

  // If not all query characters were found, return lower score
  if (queryIdx < queryLower.length) return 0;

  // Calculate score based on how "compact" the match is
  // Lower ratio means the match is more spread out
  const matchQuality = score / Math.max(strLower.length, queryLower.length);
  
  return Math.min(1, matchQuality * 0.7);
}

/**
 * Get match positions for highlighting
 */
function getMatchPositions(
  str: string,
  query: string
): { start: number; end: number }[] {
  const strLower = str.toLowerCase();
  const queryLower = query.toLowerCase();
  const matches: { start: number; end: number }[] = [];

  // Check for substring match first (most common case)
  const substringIndex = strLower.indexOf(queryLower);
  if (substringIndex !== -1) {
    return [{ start: substringIndex, end: substringIndex + queryLower.length }];
  }

  // For fuzzy matches, find individual character positions
  let queryIdx = 0;
  for (let i = 0; i < strLower.length && queryIdx < queryLower.length; i++) {
    if (strLower[i] === queryLower[queryIdx]) {
      matches.push({ start: i, end: i + 1 });
      queryIdx++;
    }
  }

  return matches;
}

/**
 * Perform fuzzy search on an array of items
 * @param items Items to search through
 * @param query Search query
 * @param searchFields Fields to search in
 * @param minScore Minimum score threshold (0-1)
 * @returns Sorted array of results by score (highest first)
 */
export function fuzzySearch<T extends Record<string, any>>(
  items: T[],
  query: string,
  searchFields: (keyof T)[],
  minScore: number = 0.3
): FuzzySearchResult<T>[] {
  if (!query.trim()) return [];

  const results: FuzzySearchResult<T>[] = [];

  for (const item of items) {
    let maxScore = 0;
    let bestMatches: { start: number; end: number }[] = [];

    // Search across all fields
    for (const field of searchFields) {
      const value = item[field];
      if (!value) continue;

      const fieldValue = String(value);
      const score = fuzzyMatch(fieldValue, query);

      if (score > maxScore) {
        maxScore = score;
        bestMatches = getMatchPositions(fieldValue, query);
      }
    }

    // Only include results above threshold
    if (maxScore >= minScore) {
      results.push({
        item,
        score: maxScore,
        matches: bestMatches,
      });
    }
  }

  // Sort by score (highest first)
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Highlight matched text in a string
 */
export function highlightMatches(
  text: string,
  matches: { start: number; end: number }[]
): { text: string; highlighted: boolean }[] {
  if (matches.length === 0) {
    return [{ text, highlighted: false }];
  }

  // Sort matches by start position
  const sortedMatches = [...matches].sort((a, b) => a.start - b.start);
  const result: { text: string; highlighted: boolean }[] = [];
  let lastEnd = 0;

  for (const match of sortedMatches) {
    // Add non-highlighted text before match
    if (match.start > lastEnd) {
      result.push({
        text: text.substring(lastEnd, match.start),
        highlighted: false,
      });
    }

    // Add highlighted match
    result.push({
      text: text.substring(match.start, match.end),
      highlighted: true,
    });

    lastEnd = match.end;
  }

  // Add remaining text
  if (lastEnd < text.length) {
    result.push({
      text: text.substring(lastEnd),
      highlighted: false,
    });
  }

  return result;
}
