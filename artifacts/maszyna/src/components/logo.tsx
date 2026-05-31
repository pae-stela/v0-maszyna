export function MaszynaLogo({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Soft background circle */}
      <circle cx="40" cy="40" r="36" fill="var(--color-navy)" opacity="0.06" />

      {/* ===== LEAVES (organic, full shapes) ===== */}
      {/* Left leaf */}
      <path
        d="M28 48 Q18 42 16 34 Q22 36 28 42 Q34 36 30 30 Q28 38 28 48"
        fill="var(--color-sage)"
        opacity="0.7"
      />
      <path
        d="M28 48 Q28 38 30 30"
        stroke="var(--color-sage-dark)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />

      {/* Right leaf */}
      <path
        d="M52 48 Q62 42 64 34 Q58 36 52 42 Q46 36 50 30 Q52 38 52 48"
        fill="var(--color-moss)"
        opacity="0.6"
      />
      <path
        d="M52 48 Q52 38 50 30"
        stroke="var(--color-sage-dark)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />

      {/* Bottom center leaf */}
      <path
        d="M40 54 Q32 58 28 52 Q34 52 40 48 Q46 52 52 52 Q48 58 40 54"
        fill="var(--color-sage)"
        opacity="0.5"
      />

      {/* ===== HEX NUT (centered) ===== */}
      {/* Hex body fill */}
      <path
        d="M40 26 L49.5 31.5 L49.5 42.5 L40 48 L30.5 42.5 L30.5 31.5 Z"
        fill="var(--color-navy)"
        opacity="0.08"
      />
      {/* Hex outline */}
      <path
        d="M40 26 L49.5 31.5 L49.5 42.5 L40 48 L30.5 42.5 L30.5 31.5 Z"
        stroke="var(--color-navy)"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Center hole */}
      <circle cx="40" cy="37" r="5" stroke="var(--color-navy)" strokeWidth="2" fill="none" />
      {/* Small inner detail */}
      <circle cx="40" cy="37" r="2" fill="var(--color-navy)" opacity="0.35" />

      {/* Seed accent */}
      <circle cx="40" cy="37" r="1" fill="var(--color-terracotta)" opacity="0.6" />
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

      {/* Leaves (full shapes) */}
      <path
        d="M14 24 Q8 21 7 17 Q11 18 14 22 Q17 18 15 15 Q14 19 14 24"
        fill="var(--color-sage)"
        opacity="0.7"
      />
      <path
        d="M26 24 Q32 21 33 17 Q29 18 26 22 Q23 18 25 15 Q26 19 26 24"
        fill="var(--color-moss)"
        opacity="0.6"
      />
      <path
        d="M20 27 Q14 29 12 26 Q16 26 20 24 Q24 26 28 26 Q26 29 20 27"
        fill="var(--color-sage)"
        opacity="0.5"
      />

      {/* Hex nut (centered) */}
      <path
        d="M20 13 L26.5 16.75 L26.5 23.25 L20 27 L13.5 23.25 L13.5 16.75 Z"
        fill="var(--color-navy)"
        opacity="0.1"
      />
      <path
        d="M20 13 L26.5 16.75 L26.5 23.25 L20 27 L13.5 23.25 L13.5 16.75 Z"
        stroke="var(--color-navy)"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="20" cy="20" r="2.5" stroke="var(--color-navy)" strokeWidth="1.5" fill="none" />
      <circle cx="20" cy="20" r="1" fill="var(--color-navy)" opacity="0.35" />
    </svg>
  )
}
