export function MaszynaLogo({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer organic ring - like a leaf or seed */}
      <circle cx="40" cy="40" r="38" fill="var(--color-navy)" opacity="0.08" />
      <circle cx="40" cy="40" r="34" fill="var(--color-navy)" opacity="0.12" />

      {/* Gear/cog - the machine */}
      <g fill="var(--color-navy)">
        <circle cx="40" cy="40" r="16" />
        {/* Gear teeth */}
        <rect x="38" y="4" width="4" height="12" rx="1" />
        <rect x="38" y="64" width="4" height="12" rx="1" />
        <rect x="4" y="38" width="12" height="4" rx="1" />
        <rect x="64" y="38" width="12" height="4" rx="1" />
        <rect x="13.5" y="13.5" width="8" height="4" rx="1" transform="rotate(-45 17.5 15.5)" />
        <rect x="58.5" y="13.5" width="8" height="4" rx="1" transform="rotate(45 62.5 15.5)" />
        <rect x="13.5" y="58.5" width="8" height="4" rx="1" transform="rotate(45 17.5 60.5)" />
        <rect x="58.5" y="58.5" width="8" height="4" rx="1" transform="rotate(-45 62.5 60.5)" />
      </g>

      {/* Inner gear detail */}
      <circle cx="40" cy="40" r="10" fill="var(--color-cream)" />
      <circle cx="40" cy="40" r="4" fill="var(--color-navy)" />

      {/* Organic leaves growing from the gear */}
      <path
        d="M40 24 C40 24 38 14 32 10 C34 14 36 20 38 24"
        fill="var(--color-sage)"
      />
      <path
        d="M40 24 C40 24 42 14 48 10 C46 14 44 20 42 24"
        fill="var(--color-moss)"
      />
      <path
        d="M56 40 C56 40 66 38 70 32 C66 34 60 36 56 38"
        fill="var(--color-sage)"
      />
      <path
        d="M56 40 C56 40 66 42 70 48 C66 46 60 44 56 42"
        fill="var(--color-moss)"
      />
      <path
        d="M40 56 C40 56 42 66 48 70 C46 66 44 60 42 56"
        fill="var(--color-sage)"
      />
      <path
        d="M24 40 C24 40 14 42 10 48 C14 46 20 44 24 42"
        fill="var(--color-moss)"
      />

      {/* Small accent dots - seeds */}
      <circle cx="40" cy="40" r="2.5" fill="var(--color-terracotta)" opacity="0.7" />
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
      <circle cx="20" cy="20" r="18" fill="var(--color-navy)" opacity="0.1" />
      <g fill="var(--color-navy)">
        <circle cx="20" cy="20" r="8" />
        <rect x="19" y="2" width="2" height="6" rx="0.5" />
        <rect x="19" y="32" width="2" height="6" rx="0.5" />
        <rect x="2" y="19" width="6" height="2" rx="0.5" />
        <rect x="32" y="19" width="6" height="2" rx="0.5" />
      </g>
      <circle cx="20" cy="20" r="5" fill="var(--color-cream)" />
      <path d="M20 12 C20 12 19 7 16 5 C17 7 18 10 19 12" fill="var(--color-sage)" />
      <path d="M20 12 C20 12 21 7 24 5 C23 7 22 10 21 12" fill="var(--color-moss)" />
      <circle cx="20" cy="20" r="1.5" fill="var(--color-terracotta)" opacity="0.7" />
    </svg>
  )
}
