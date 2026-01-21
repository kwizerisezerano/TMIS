export const useApi = () => {
  const config = useRuntimeConfig()
  const { token } = useAuth()

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    headers: {
      'Content-Type': 'application/json'
    },
    onRequest({ options }) {
      // Add authorization header if token exists
      if (token.value) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token.value}`
        }
      }
    }
  })

  return { api }
}