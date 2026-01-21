export const useAuth = () => {
  const user = useState('user', () => null)
  const token = useState('token', () => null)
  const isAuthenticated = computed(() => !!token.value)

  const login = async (email, password) => {
    const { api } = useApi()

    try {
      const response = await api('/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      // Store token and user data
      token.value = response.token
      user.value = response.user

      // Store in localStorage for persistence
      if (process.client) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
      }

      return response
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    user.value = null
    token.value = null

    if (process.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }

    navigateTo('/login')
  }

  const register = async (userData) => {
    const { api } = useApi()

    try {
      const response = await api('/auth/register', {
        method: 'POST',
        body: userData
      })

      return response
    } catch (error) {
      throw error
    }
  }

  const verifyEmail = async (verificationKey, verificationCode) => {
    const { api } = useApi()

    try {
      const response = await api('/auth/verify-email', {
        method: 'POST',
        body: { verificationKey, verificationCode }
      })

      return response
    } catch (error) {
      throw error
    }
  }

  const resendOtp = async (verificationKey) => {
    const { api } = useApi()

    try {
      const response = await api('/auth/resend-otp', {
        method: 'POST',
        body: { verificationKey }
      })

      return response
    } catch (error) {
      throw error
    }
  }

  // Initialize auth state from localStorage on client side
  const initAuth = () => {
    if (process.client) {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
      }
    }
  }

  // Call initAuth when composable is used
  if (process.client) {
    initAuth()
  }

  return {
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    login,
    logout,
    register,
    verifyEmail,
    resendOtp,
    initAuth
  }
}