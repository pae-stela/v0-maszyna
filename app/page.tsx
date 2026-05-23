import { UserProvider } from "@/lib/user-context"
import { AppShell } from "@/components/app-shell"

export default function Home() {
  return (
    <UserProvider>
      <AppShell />
    </UserProvider>
  )
}
