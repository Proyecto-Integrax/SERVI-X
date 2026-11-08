import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
const SESSION_KEY = 'servix_session_v1'
const useMock = import.meta.env.VITE_USE_MOCK_API !== 'false'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Si cambiamos de mock a API real (o viceversa), una sesion vieja sin el
    // campo esperado para este modo rompe las llamadas; se descarta en vez
    // de dejar al usuario "logueado" con una sesion invalida.
    if (!useMock && !parsed.token) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return parsed
  })

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  }, [session])

  const login = (usuario) => setSession(usuario)
  const logout = () => setSession(null)

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
