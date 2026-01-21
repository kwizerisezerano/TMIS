<template>
  <div class="min-h-screen bg-white dark:bg-black">
    <div class="max-w-2xl mx-auto p-6">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-green-600 dark:text-white">My Profile</h1>
          <p class="text-gray-600 dark:text-white">View your account information</p>
        </div>
        <UButton @click="navigateTo('/dashboard')" variant="outline">
          Back to Dashboard
        </UButton>
      </div>

      <!-- Profile Header -->
      <UCard class="border-0 shadow-lg mb-6 bg-white dark:bg-gray-800">
        <div class="p-6 text-center">
          <div class="w-20 h-20 bg-green-600 dark:bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-white font-bold text-2xl">{{ getUserInitials() }}</span>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ profileData.names }}</h2>
          <p class="text-gray-600 dark:text-white">{{ getRoleDisplay(profileData.role) }}</p>
          <div class="flex justify-center gap-2 mt-2">
            <span class="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
              {{ getMemberTypeDisplay(profileData.member_type) }}
            </span>
            <span v-if="profileData.email_verified" class="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
              ✓ Verified
            </span>
          </div>
        </div>
      </UCard>

      <!-- Personal Information -->
      <UCard class="border-0 shadow-lg mb-6">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-green-600 mb-4">Personal Information</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-white mb-1">Full Name</label>
              <p class="text-gray-900 dark:text-white">{{ profileData.names || 'Not provided' }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-white mb-1">Email Address</label>
              <p class="text-gray-900 dark:text-white">{{ profileData.email || 'Not provided' }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-white mb-1">Phone Number</label>
              <p class="text-gray-900 dark:text-white">{{ profileData.phone || 'Not provided' }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-white mb-1">National ID Number</label>
              <p class="text-gray-900 dark:text-white">
                <span v-if="profileData?.id_number || user?.value?.id_number">
                  {{ profileData?.id_number || user?.value?.id_number }}
                </span>
                <span v-else>
                  Not provided
                  <UButton @click="navigateTo('/settings')" size="xs" class="ml-2 bg-green-600 hover:bg-green-700 text-white">
                    Add ID
                  </UButton>
                </span>
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Association Information -->
      <UCard class="border-0 shadow-lg mb-6">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-green-600 mb-4">Association Information</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-white mb-1">Role</label>
              <p class="text-gray-900 dark:text-white">{{ getRoleDisplay(profileData.role) }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-white mb-1">Member Type</label>
              <p class="text-gray-900 dark:text-white">{{ getMemberTypeDisplay(profileData.member_type) }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-white mb-1">Join Date</label>
              <p class="text-gray-900 dark:text-white">{{ formatDate(profileData.first_joined_date || profileData.created_at) }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-white mb-1">Account Status</label>
              <p class="text-gray-900 dark:text-white">{{ profileData.status || 'Active' }}</p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Account Statistics -->
      <UCard class="border-0 shadow-lg">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-green-600 mb-4">Account Statistics</h3>
          
          <div v-if="loading" class="text-center py-4">
            <div class="text-gray-500">Loading statistics...</div>
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600">RWF {{ stats.totalContributions.toLocaleString() }}</div>
              <div class="text-sm text-gray-600">Total Contributions</div>
            </div>
            
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">{{ stats.activeTontines }}</div>
              <div class="text-sm text-gray-600">Active Tontines</div>
            </div>
            
            <div class="text-center p-4 bg-purple-50 rounded-lg">
              <div class="text-2xl font-bold text-purple-600">RWF {{ stats.totalLoans.toLocaleString() }}</div>
              <div class="text-sm text-gray-600">Total Loans</div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const loading = ref(true)
const user = ref(null)
const profileData = ref({})
const stats = ref({
  totalContributions: 0,
  activeTontines: 0,
  totalLoans: 0
})

onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
      await loadProfile() // Fetch fresh data from API
      await loadStats()
    }
  }
})

const loadProfile = async () => {
  try {
    const response = await fetch(`http://localhost:8000/api/auth/users/${user.value.id}`)
    const data = await response.json()
    profileData.value = data
  } catch (error) {
    console.error('Failed to load profile:', error)
    // Use localStorage data as fallback
    profileData.value = user.value
  }
}

const loadStats = async () => {
  try {
    // Fetch contributions
    const contributionsResponse = await fetch(`http://localhost:8000/api/contributions/user/${user.value.id}`)
    const contributions = await contributionsResponse.json()
    stats.value.totalContributions = contributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
    
    // Fetch tontines
    const tontinesResponse = await fetch(`http://localhost:8000/api/tontines/user/${user.value.id}`)
    const tontines = await tontinesResponse.json()
    stats.value.activeTontines = tontines.length
    
    // Get first joined tontine date
    if (tontines.length > 0) {
      const firstTontine = tontines.reduce((earliest, current) => {
        return new Date(current.created_at) < new Date(earliest.created_at) ? current : earliest
      })
      profileData.value.first_joined_date = firstTontine.created_at
    }
    
    // Fetch loans
    const loansResponse = await fetch(`http://localhost:8000/api/loans/user/${user.value.id}`)
    const loans = await loansResponse.json()
    stats.value.totalLoans = loans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
    
  } catch (error) {
    console.error('Failed to load stats:', error)
  } finally {
    loading.value = false
  }
}

const getUserInitials = () => {
  if (!profileData.value.names) return 'U'
  const names = profileData.value.names.split(' ')
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase()
  }
  return profileData.value.names[0].toUpperCase()
}

const getRoleDisplay = (role) => {
  const roles = {
    member: 'Member',
    president: 'President',
    vice_president: 'Vice President',
    secretary: 'Secretary/Accountant',
    advisor: 'Advisor',
    auditor: 'Auditor'
  }
  return roles[role] || 'Member'
}

const getMemberTypeDisplay = (type) => {
  const types = {
    founding: 'Founding Member',
    incoming: 'Incoming Member',
    honorary: 'Honorary Member'
  }
  return types[type] || 'Incoming Member'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not available'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

definePageMeta({
  layout: 'default'
})
</script>