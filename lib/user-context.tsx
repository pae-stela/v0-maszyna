"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type User = "patrycja" | "marcin"

interface UserContextType {
  activeUser: User
  setActiveUser: (user: User) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUser] = useState<User>("patrycja")

  return (
    <UserContext.Provider value={{ activeUser, setActiveUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
