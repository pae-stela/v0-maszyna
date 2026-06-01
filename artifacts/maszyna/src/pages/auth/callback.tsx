import { useEffect } from 'react'

export default function AuthCallbackPage() {
  useEffect(() => {
    // Statyczne Netlify ignoruje serwerową wymianę kodu i od razu 
    // przenosi zalogowanego użytkownika do wnętrza aplikacji.
    window.location.href = '/app'
  }, [])

  return null
}
