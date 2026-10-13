/**
 * Generate a colored SVG placeholder image based on product title
 * This creates data URIs that work completely offline without network requests
 */

// Color palette for consistent but varied placeholder colors
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#82E0AA',
  '#F1948A', '#D7BDE2', '#A9DFBF', '#F9E2AF', '#FADBD8'
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function getColorForTitle(title: string): string {
  const hash = hashCode(title);
  return COLORS[hash % COLORS.length];
}

function getInitials(title: string): string {
  return title
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generatePlaceholder(title: string, size: number = 300): string {
  const color = getColorForTitle(title);
  const initials = getInitials(title);
  
  // Create SVG placeholder as data URI
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${color}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="${size * 0.25}" font-weight="bold" fill="white" font-family="Arial, sans-serif">${initials}</text></svg>`;
  
  // Use btoa for browser-safe base64 encoding
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Convert external URLs to data URIs if they fail to load
 * For now, just returns the placeholder
 */
export function getFallbackImage(title: string): string {
  return generatePlaceholder(title);
}
