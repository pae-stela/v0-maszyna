import { createContext, useContext, useState, type ReactNode } from 'react'

export const PARTNER_COLORS = [
  { name: 'Navy', hex: '#3D5A6C' },
  { name: 'Sage', hex: '#7A9E7E' },
  { name: 'Terracotta', hex: '#C4784A' },
  { name: 'Amber', hex: '#B5923A' },
  { name: 'Plum', hex: '#7B6B9A' },
]

interface PartnerColorsContextType {
  myColor: string
  partnerColor: string
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

  const setMyColor = (color: string) => {
    setMyColorState(color)
    try { localStorage.setItem('myColor', color) } catch { }
  }

  const setPartnerColor = (color: string) => {
    setPartnerColorState(color)
    try { localStorage.setItem('partnerColor', color) } catch { }
  }

  return (
    <PartnerColorsContext.Provider value={{ myColor, partnerColor, setMyColor, setPartnerColor }}>
      {children}
    </PartnerColorsContext.Provider>
  )
}

export function usePartnerColors() {
  const context = useContext(PartnerColorsContext)
  if (!context) throw new Error('usePartnerColors must be used within PartnerColorsProvider')
  return context
}
