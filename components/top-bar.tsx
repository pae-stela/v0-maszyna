"use client"

import { useUser } from "@/lib/user-context"
import { Bell } from "lucide-react"

function WhiteCat() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none">
      <ellipse cx="12" cy="13" rx="8" ry="7" fill="#f5f5f5" />
      <ellipse cx="12" cy="14" rx="6" ry="5" fill="#fafafa" />
      <path d="M4.5 8 C4 4, 7 5, 8 8" fill="#f5f5f5" />
      <path d="M19.5 8 C20 4, 17 5, 16 8" fill="#f5f5f5" />
      <circle cx="9" cy="12" r="1.5" fill="#1a1a1a" />
      <circle cx="15" cy="12" r="1.5" fill="#1a1a1a" />
      <ellipse cx="12" cy="14.5" rx="1" ry="0.6" fill="#ffb6c1" />
      <path d="M11 15.5 Q12 16.5 13 15.5" stroke="#888" strokeWidth="0.5" fill="none" />
    </svg>
  )
}

function BlackCat() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none">
      <ellipse cx="12" cy="13" rx="8" ry="7" fill="#1a1a1a" />
      <ellipse cx="12" cy="14" rx="6" ry="5" fill="#2a2a2a" />
      <path d="M4.5 8 C4 4, 7 5, 8 8" fill="#1a1a1a" />
      <path d="M19.5 8 C20 4, 17 5, 16 8" fill="#1a1a1a" />
      <circle cx="9" cy="12" r="1.5" fill="#a8e6cf" />
      <circle cx="15" cy="12" r="1.5" fill="#a8e6cf" />
      <circle cx="9" cy="12" r="0.5" fill="#1a1a1a" />
      <circle cx="15" cy="12" r="0.5" fill="#1a1a1a" />
      <ellipse cx="12" cy="14.5" rx="1" ry="0.6" fill="#ffb6c1" />
      <path d="M11 15.5 Q12 16.5 13 15.5" stroke="#666" strokeWidth="0.5" fill="none" />
    </svg>
  )
}

export function TopBar() {
  const { activeUser, setActiveUser } = useUser()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
        <button
          onClick={() => setActiveUser("patrycja")}
          className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            activeUser === "patrycja"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <WhiteCat />
          <span>Patrycja</span>
        </button>
        <button
          onClick={() => setActiveUser("marcin")}
          className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            activeUser === "marcin"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BlackCat />
          <span>Marcin</span>
        </button>
      </div>

      <button className="relative p-2 rounded-full hover:bg-secondary transition-colors">
        <Bell className="size-5 text-foreground" />
        <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full" />
      </button>
    </header>
  )
}
