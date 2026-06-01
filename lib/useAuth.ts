import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useAuth() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/')
      } else {
        setIsAuthenticated(true)
      }
      setIsLoading(false)
    }

    // Ejecutar cuando el componente se monta
    checkAuth()
  }, [router])

  return { isAuthenticated, isLoading }
}
