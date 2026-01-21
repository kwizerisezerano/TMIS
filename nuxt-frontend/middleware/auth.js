export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth()

  // If not authenticated and trying to access protected route
  if (!isAuthenticated.value && !['/login', '/register', '/verify-email'].includes(to.path)) {
    return navigateTo('/login')
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated.value && ['/login', '/register'].includes(to.path)) {
    return navigateTo('/dashboard')
  }
})