import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lms_user') || 'null') } catch { return null }
  })
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('lms_token')))

  useEffect(() => {
    if (!localStorage.getItem('lms_token')) {
      setLoading(false)
      return
    }
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user)
        localStorage.setItem('lms_user', JSON.stringify(data.user))
      })
      .catch(() => {
        localStorage.removeItem('lms_token')
        localStorage.removeItem('lms_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('lms_token', data.token)
    localStorage.setItem('lms_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('lms_token')
    localStorage.removeItem('lms_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
