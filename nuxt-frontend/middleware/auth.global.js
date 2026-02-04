export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server side
  if (process.server) return
  
  // Check localStorage for authentication
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  const isAuthenticated = !!(token && user)

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/verify-email', '/', '/landing', '/terms']

  // If not authenticated and trying to access protected route
  if (!isAuthenticated && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && ['/login', '/register'].includes(to.path)) {
    return navigateTo('/dashboard')
  }
})