interface LogoProps {
  className?: string;
}

export function MaszynaLogo({ className = "w-20 h-20" }: LogoProps) {
  return (
    <img 
      src="/logo-full.svg" 
      alt="Maszyna Logo" 
      className={`${className} object-contain`}
      draggable={false}
    />
  );
}

export function MaszynaIcon({ className = "w-8 h-8" }: LogoProps) {
  return (
    <img 
      src="/favicon.svg" 
      alt="Maszyna Icon" 
      className={`${className} object-contain`}
      draggable={false}
    />
  );
}