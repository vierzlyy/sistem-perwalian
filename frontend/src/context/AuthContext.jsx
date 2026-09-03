/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
} from 'react'

const AuthContext = createContext(null)

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000/api'

function getApiErrorMessage(data, fallback) {
  if (data?.errors) {
    const firstError = Object.values(data.errors)
      .flat()
      .find(Boolean)

    if (firstError) {
      return firstError
    }
  }

  return data?.message || fallback
}

function getStoredUser() {
  try {
    const stored = localStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('User storage error:', error)

    localStorage.removeItem('auth_user')
    return null
  }
}

function getStoredToken() {
  try {
    return localStorage.getItem('auth_token') || null
  } catch (error) {
    console.error('Token storage error:', error)

    localStorage.removeItem('auth_token')
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)
  const [token, setToken] = useState(getStoredToken)

  const login = async (username, password) => {
    let response

    try {
      response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })
    } catch (error) {
      console.error('Login gagal:', error)

      const connectionError = new Error(
        'Tidak dapat terhubung ke server. Silakan coba lagi.'
      )

      connectionError.code = 'CONNECTION_ERROR'
      throw connectionError
    }

    let data = null

    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (!response.ok) {
      const error = new Error(
        getApiErrorMessage(
          data,
          response.status === 403
            ? 'Akun tidak memiliki izin untuk masuk.'
            : 'Username atau password salah.'
        )
      )

      error.status = response.status
      error.code = data?.code || 'LOGIN_FAILED'

      throw error
    }

    if (!data?.token || !data?.user) {
      throw new Error(
        'Respons login dari server tidak valid.'
      )
    }

    setUser(data.user)
    setToken(data.token)

    localStorage.setItem(
      'auth_user',
      JSON.stringify(data.user)
    )

    localStorage.setItem(
      'auth_token',
      data.token
    )

    return data.user
  }

  const logout = async () => {
    const currentToken = token

    setUser(null)
    setToken(null)

    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('demo_user')

    if (!currentToken) {
      return
    }

    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      })
    } catch (error) {
      console.error('Logout API gagal:', error)
    }
  }

  const hasRole = (role) => {
    return user?.role === role
  }

  const isAuthenticated = Boolean(
    user && token
  )

  const getCurrentUser = () => user

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        hasRole,
        isAuthenticated,
        getCurrentUser,
        API_BASE_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}