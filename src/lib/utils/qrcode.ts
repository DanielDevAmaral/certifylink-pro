/**
 * Utility functions for QR Code generation with Certbase branding
 */

/**
 * Converts the Certbase logo icon SVG to a Data URL for embedding in QR codes
 * @returns Data URL string of the Certbase logo
 */
export const getCertbaseLogoDataUrl = (): string => {
  const svg = `
    <svg viewBox="0 0 70 90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradMainIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#82D400;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#AED748;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="gradAccentIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#660099;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#BD4AFF;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="70" height="90" fill="white" rx="8"/>
      <g transform="translate(5, 10)">
        <rect x="15" y="10" width="50" height="40" rx="6" fill="#BD4AFF" opacity="0.3"/>
        <rect x="10" y="15" width="50" height="40" rx="6" fill="url(#gradAccentIcon)" opacity="0.7"/>
        <rect x="5" y="20" width="50" height="40" rx="6" fill="url(#gradMainIcon)"/>
        <circle cx="30" cy="35" r="3" fill="#ffffff"/>
        <ellipse cx="30" cy="35" rx="10" ry="4" fill="none" stroke="#ffffff" stroke-width="2"/>
        <ellipse cx="30" cy="40" rx="10" ry="4" fill="none" stroke="#ffffff" stroke-width="2"/>
        <ellipse cx="30" cy="45" rx="10" ry="4" fill="none" stroke="#ffffff" stroke-width="2"/>
        <line x1="20" y1="35" x2="20" y2="45" stroke="#ffffff" stroke-width="2"/>
        <line x1="40" y1="35" x2="40" y2="45" stroke="#ffffff" stroke-width="2"/>
        <path d="M44 25 L47 28 L52 22" fill="none" stroke="#82D400" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>
  `;
  
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
    
  return `data:image/svg+xml,${encoded}`;
};
