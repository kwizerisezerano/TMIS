<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Sidebar -->
    <div class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0" 
         :class="{ '-translate-x-full': !sidebarOpen }">
      
      <!-- Logo -->
      <div class="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-green-600 to-green-700">
        <h1 class="text-xl font-bold text-white">🌱 The Future</h1>
      </div>

      <!-- Navigation -->
      <nav class="mt-8 px-4 space-y-2">
        <NuxtLink v-for="item in navigation" :key="item.name" :to="item.href"
                  @click="sidebarOpen = false"
                  class="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200"
                  :class="$route.path === item.href 
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-r-2 border-green-600' 
                    : 'text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'">
          <Icon :name="item.icon" class="w-5 h-5 mr-3 text-gray-600 dark:text-white" />
          {{ item.name }}
        </NuxtLink>
      </nav>

      <!-- User Profile -->
      <div class="absolute bottom-0 left-0 right-0 p-4">
        <div class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
            <span class="text-green-600 dark:text-green-300 font-semibold text-sm">{{ getUserInitials() }}</span>
          </div>
          <div class="ml-3 flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ user?.names }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user?.email }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="lg:pl-64">
      <!-- Top Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between px-4 py-4">
          <button @click="sidebarOpen = !sidebarOpen" class="lg:hidden">
            <Icon name="i-heroicons-bars-3" class="w-6 h-6 text-gray-600 dark:text-white" />
          </button>
          
          <div class="flex items-center space-x-4">
            <!-- Theme Toggle -->
            <button @click="toggleTheme" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Icon :name="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'" class="w-5 h-5 text-gray-600 dark:text-white" />
            </button>
            
            <!-- Notifications -->
            <div class="relative">
              <button @click="showNotifications = !showNotifications" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Icon name="i-heroicons-bell" class="w-5 h-5 text-gray-600 dark:text-white" />
              </button>
              <div v-if="unreadCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </div>
              
              <!-- Notifications Dropdown -->
              <div v-if="showNotifications" class="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                <div class="p-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 class="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                </div>
                <div v-if="notifications.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
                <div v-else>
                  <div v-for="notification in notifications" :key="notification.id" 
                       class="p-4 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                       :class="{ 'bg-blue-50 dark:bg-blue-900/20': !notification.is_read }"
                       @click="markAsRead(notification.id)">
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0">
                        <div class="w-2 h-2 rounded-full" :class="notification.is_read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-blue-500'"></div>
                      </div>
                      <div class="flex-1">
                        <h4 class="font-medium text-sm text-gray-900 dark:text-white">{{ notification.title }}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">{{ notification.message }}</p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">{{ formatDate(notification.created_at) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- User Menu -->
            <div class="relative">
              <button @click="showUserDropdown = !showUserDropdown" class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <div class="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <span class="text-green-600 dark:text-green-300 font-semibold text-sm">{{ getUserInitials() }}</span>
                </div>
                <Icon name="i-heroicons-chevron-down" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              
              <!-- Dropdown Menu -->
              <div v-if="showUserDropdown" class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div class="py-2">
                  <div class="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ user?.names }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user?.email }}</p>
                  </div>
                  <button @click="navigateTo('/profile'); showUserDropdown = false" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                    <Icon name="i-heroicons-user" class="w-4 h-4 text-gray-600 dark:text-white" />
                    Profile
                  </button>
                  <button @click="navigateTo('/settings'); showUserDropdown = false" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                    <Icon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-gray-600 dark:text-white" />
                    Settings
                  </button>
                  <button @click="handleLogout" class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                    <Icon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6 bg-white dark:bg-gray-900 min-h-screen">
        <slot />
      </main>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false" 
         class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"></div>
  </div>
</template>

<script setup>
const sidebarOpen = ref(false)
const showUserDropdown = ref(false)
const showNotifications = ref(false)
const user = ref(null)
const notifications = ref([])
const unreadCount = ref(0)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// Get user data
onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
      await fetchNotifications()
      
      // Set up periodic refresh for notifications
      setInterval(fetchNotifications, 30000) // Refresh every 30 seconds
      
      // Set up auto-refresh listener
      setupAutoRefresh()
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.relative')) {
        showUserDropdown.value = false
        showNotifications.value = false
      }
    })
  }
})

const setupAutoRefresh = () => {
  // Listen for storage events (cross-tab communication)
  window.addEventListener('storage', (e) => {
    if (e.key === 'auto-refresh-trigger') {
      console.log('Auto-refresh triggered by storage event')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  })
  
  // Listen for custom events
  window.addEventListener('auto-refresh', () => {
    console.log('Auto-refresh triggered by custom event')
    setTimeout(() => {
      window.location.reload()
    }, 500)
  })
}

const handleLogout = () => {
  if (process.client) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
  showUserDropdown.value = false
  navigateTo('/login')
}

const getUserInitials = () => {
  if (!user.value?.names) return 'U'
  const names = user.value.names.split(' ')
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase()
  }
  return user.value.names[0].toUpperCase()
}

const fetchNotifications = async () => {
  try {
    const response = await fetch(`http://localhost:8000/api/notifications/${user.value.id}`)
    const data = await response.json()
    notifications.value = data
    unreadCount.value = data.filter(n => !n.is_read).length
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
  }
}

const markAsRead = async (notificationId) => {
  try {
    await fetch(`http://localhost:8000/api/notifications/${notificationId}/read`, {
      method: 'PUT'
    })
    
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification && !notification.is_read) {
      notification.is_read = true
      unreadCount.value--
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString()
}

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const navigation = computed(() => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'i-heroicons-home' },
    { name: 'Contributions', href: '/contributions', icon: 'i-heroicons-banknotes' },
    { name: 'Loans', href: '/loans', icon: 'i-heroicons-credit-card' },
    { name: 'Payments', href: '/payments', icon: 'i-heroicons-banknotes' },
    { name: 'Reports', href: '/reports', icon: 'i-heroicons-chart-bar' },
    { name: 'Meetings', href: '/meetings', icon: 'i-heroicons-users' },
    { name: 'Penalties', href: '/penalties', icon: 'i-heroicons-scale' }
  ]
  
  // Add Tontines link only for admins
  if (user.value?.role === 'admin' || user.value?.role === 'president') {
    baseNavigation.splice(1, 0, { name: 'Tontines', href: '/tontines', icon: 'i-heroicons-users' })
  }
  
  return baseNavigation
})

</script>