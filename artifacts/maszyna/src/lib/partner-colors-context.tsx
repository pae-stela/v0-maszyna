import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

// ─── Color utilities ────────────────────────────────────────────────────────

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function darkenHex(hex: string, factor = 0.38): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`
}

export function makeGradient(hex: string, angle = 135): string {
  return `linear-gradient(${angle}deg, ${darkenHex(hex)} 0%, ${hex} 100%)`
}

// ─── 9 partner colours ───────────────────────────────────────────────────────

export const PARTNER_COLORS = [
  { name: 'Navy',       hex: '#3D5A6C' },
  { name: 'Sage',       hex: '#7A9E7E' },
  { name: 'Terracotta', hex: '#C4784A' },
  { name: 'Amber',      hex: '#B5923A' },
  { name: 'Plum',       hex: '#7B6B9A' },
  { name: 'Forest',     hex: '#2D5E3A' },
  { name: 'Moss',       hex: '#7B9D6A' },
  { name: 'Rose',       hex: '#B87A8C' },
  { name: 'Clay',       hex: '#9E6B5A' },
]

// ─── Context ─────────────────────────────────────────────────────────────────

interface PartnerColorsContextType {
  myColor: string
  partnerColor: string
  myGradient: string
  partnerGradient: string
  setMyColor: (color: string) => void
  setPartnerColor: (color: string) => void
}

const PartnerColorsContext = createContext<PartnerColorsContextType | undefined>(undefined)

export function PartnerColorsProvider({ children }: { children: ReactNode }) {
  const [myColor, setMyColorState] = useState<string>(() => {
    try { return localStorage.getItem('myColor') || '#7A9E7E' } catch { return '#7A9E7E' }
  })
  const [partnerColor, setPartnerColorState] = useState<string>(() => {
    try { return localStorage.getItem('partnerColor') || '#3D5A6C' } catch { return '#3D5A6C' }
  })

  const myGradient      = makeGradient(myColor)
  const partnerGradient = makeGradient(partnerColor)

  // Inject CSS custom properties so .btn-profile and other classes react to color changes
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--gradient-profile', myGradient)
    root.style.setProperty('--color-my', myColor)
  }, [myColor, myGradient])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--gradient-partner', partnerGradient)
    root.style.setProperty('--color-partner', partnerColor)
  }, [partnerColor, partnerGradient])

  const setMyColor = (color: string) => {
    setMyColorState(color)
    try { localStorage.setItem('myColor', color) } catch { }
  }

  const setPartnerColor = (color: string) => {
    setPartnerColorState(color)
    try { localStorage.setItem('partnerColor', color) } catch { }
  }

  return (
    <PartnerColorsContext.Provider value={{ myColor, partnerColor, myGradient, partnerGradient, setMyColor, setPartnerColor }}>
      {children}
    </PartnerColorsContext.Provider>
  )
}

export function usePartnerColors() {
  const context = useContext(PartnerColorsContext)
  if (!context) throw new Error('usePartnerColors must be used within PartnerColorsProvider')
  return context
}
