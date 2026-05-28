export function MaszynaLogo({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Soft background glow */}
      <circle cx="40" cy="40" r="36" fill="var(--color-navy)" opacity="0.06" />

      {/* Machine: simple hex nut / cog outline */}
      <path
        d="M40 16 L52.4 23.2 L52.4 37.6 L40 44.8 L27.6 37.6 L27.6 23.2 Z"
        fill="var(--color-navy)"
        opacity="0.12"
      />
      <path
        d="M40 20 L49.2 25.4 L49.2 36.2 L40 41.6 L30.8 36.2 L30.8 25.4 Z"
        stroke="var(--color-navy)"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Center hole of the nut */}
      <circle cx="40" cy="33.5" r="4" stroke="var(--color-navy)" strokeWidth="2" fill="none" />

      {/* Small bolt head detail */}
      <circle cx="40" cy="33.5" r="1.5" fill="var(--color-navy)" opacity="0.5" />

      {/* Leaves growing out — minimal, light strokes */}
      <path
        d="M40 41.6 Q40 52 36 58"
        stroke="var(--color-sage)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M36 58 Q30 54 28 50 Q32 52 36 58"
        fill="var(--color-sage)"
        opacity="0.7"
      />
      <path
        d="M36 58 Q42 54 44 50 Q40 52 36 58"
        fill="var(--color-moss)"
        opacity="0.6"
      />

      {/* Second small leaf */}
      <path
        d="M40 41.6 Q44 48 48 52"
        stroke="var(--color-sage)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M48 52 Q44 50 42 47 Q46 48 48 52"
        fill="var(--color-sage)"
        opacity="0.5"
      />

      {/* Tiny accent dot — seed */}
      <circle cx="40" cy="33.5" r="1" fill="var(--color-terracotta)" opacity="0.6" />
    </svg>
  )
}

export function MaszynaIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Soft background */}
      <circle cx="20" cy="20" r="18" fill="var(--color-navy)" opacity="0.08" />

      {/* Machine: hex outline */}
      <path
        d="M20 8 L26.9 12 L26.9 20 L20 24 L13.1 20 L13.1 12 Z"
        stroke="var(--color-navy)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="20" cy="16" r="2" stroke="var(--color-navy)" strokeWidth="1.5" fill="none" />

      {/* Leaves */}
      <path
        d="M20 24 Q20 30 17 34"
        stroke="var(--color-sage)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M17 34 Q14 31 13 29 Q15 30 17 34"
        fill="var(--color-sage)"
        opacity="0.7"
      />
      <path
        d="M17 34 Q20 31 21 29 Q19 30 17 34"
        fill="var(--color-moss)"
        opacity="0.6"
      />

      {/* Second leaf */}
      <path
        d="M20 24 Q23 28 25 31"
        stroke="var(--color-sage)"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M25 31 Q23 29 22 28 Q24 28 25 31"
        fill="var(--color-sage)"
        opacity="0.5"
      />
    </svg>
  )
}
