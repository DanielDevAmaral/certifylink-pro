interface SignetLogoProps {
  variant?: "full" | "icon";
  className?: string;
  size?: number;
}

export function SignetLogo({ variant = "full", className = "", size = 200 }: SignetLogoProps) {
  if (variant === "icon") {
    return (
      <svg 
        viewBox="0 0 70 90" 
        className={className}
        style={{ width: size, height: size * 1.3 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gradMainIcon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#82D400", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#AED748", stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="gradAccentIcon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#660099", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#BD4AFF", stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        <g transform="translate(5, 10)">
          {/* Back card (roxo claro) */}
          <rect x="15" y="10" width="50" height="40" rx="6" 
                fill="#BD4AFF" opacity="0.3"/>
          
          {/* Middle card (roxo) */}
          <rect x="10" y="15" width="50" height="40" rx="6" 
                fill="url(#gradAccentIcon)" opacity="0.7"/>
          
          {/* Front card (verde principal) */}
          <rect x="5" y="20" width="50" height="40" rx="6" 
                fill="url(#gradMainIcon)"/>
          
          {/* Icon on front card: database/layers */}
          <circle cx="30" cy="35" r="3" fill="#ffffff"/>
          <ellipse cx="30" cy="35" rx="10" ry="4" fill="none" stroke="#ffffff" strokeWidth="2"/>
          <ellipse cx="30" cy="40" rx="10" ry="4" fill="none" stroke="#ffffff" strokeWidth="2"/>
          <ellipse cx="30" cy="45" rx="10" ry="4" fill="none" stroke="#ffffff" strokeWidth="2"/>
          <line x1="20" y1="35" x2="20" y2="45" stroke="#ffffff" strokeWidth="2"/>
          <line x1="40" y1="35" x2="40" y2="45" stroke="#ffffff" strokeWidth="2"/>
          
          {/* Small accent detail (checkmark) */}
          <path d="M44 25 L47 28 L52 22" 
                fill="none" stroke="#82D400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    );
  }

  return (
    <svg 
      viewBox="0 0 400 200" 
      className={className}
      style={{ width: size * 2, height: size }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gradMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#82D400", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#AED748", stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#660099", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#BD4AFF", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Logo: Stack of cards/documents */}
      <g transform="translate(70, 55)">
        {/* Back card (roxo claro) */}
        <rect x="15" y="10" width="50" height="40" rx="6" 
              fill="#BD4AFF" opacity="0.3"/>
        
        {/* Middle card (roxo) */}
        <rect x="10" y="15" width="50" height="40" rx="6" 
              fill="url(#gradAccent)" opacity="0.7"/>
        
        {/* Front card (verde principal) */}
        <rect x="5" y="20" width="50" height="40" rx="6" 
              fill="url(#gradMain)"/>
        
        {/* Icon on front card: database/layers */}
        <circle cx="30" cy="35" r="3" fill="#ffffff"/>
        <ellipse cx="30" cy="35" rx="10" ry="4" fill="none" stroke="#ffffff" strokeWidth="2"/>
        <ellipse cx="30" cy="40" rx="10" ry="4" fill="none" stroke="#ffffff" strokeWidth="2"/>
        <ellipse cx="30" cy="45" rx="10" ry="4" fill="none" stroke="#ffffff" strokeWidth="2"/>
        <line x1="20" y1="35" x2="20" y2="45" stroke="#ffffff" strokeWidth="2"/>
        <line x1="40" y1="35" x2="40" y2="45" stroke="#ffffff" strokeWidth="2"/>
        
        {/* Small accent detail (checkmark) */}
        <path d="M44 25 L47 28 L52 22" 
              fill="none" stroke="#82D400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      
      {/* Text */}
      <text x="140" y="100" fontFamily="'Inter', 'Segoe UI', sans-serif" 
            fontSize="44" fontWeight="700" fill="#141414" letterSpacing="-1">
        Signet
      </text>
      
      <text x="140" y="125" fontFamily="'Inter', 'Segoe UI', sans-serif" 
            fontSize="12" fontWeight="400" fill="#660099" letterSpacing="1.5">
        DOCUMENT PLATFORM
      </text>
      
      {/* Small accent dots using brand colors */}
      <circle cx="320" cy="95" r="3" fill="#82D400"/>
      <circle cx="330" cy="95" r="3" fill="#660099" opacity="0.6"/>
    </svg>
  );
}
