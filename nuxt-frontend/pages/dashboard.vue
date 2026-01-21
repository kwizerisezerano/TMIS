<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-6xl mx-auto p-4 sm:p-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-green-600">🌱 The Future Dashboard</h1>
          <p class="text-gray-600">Welcome back, {{ userName }}!</p>
        </div>
      </div>

      <!-- My Tontines Overview -->
      <div class="mb-6 sm:mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">My Tontines</h2>
        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-500">Loading tontines...</div>
        </div>
        <div v-else-if="userTontines.length === 0" class="text-center py-8">
          <div class="text-gray-500">No tontines joined yet</div>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="tontine in userTontines" :key="tontine.id" class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-3">
              <h3 class="font-semibold text-lg text-gray-800">{{ tontine.name }}</h3>
              <UBadge :color="tontine.status === 'active' ? 'green' : 'gray'" size="xs">
                {{ tontine.status }}
              </UBadge>
            </div>
            <p class="text-sm text-gray-600 mb-3">{{ tontine.description }}</p>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">My Shares:</span>
                <span class="font-semibold text-blue-600">{{ tontine.user_shares || 1 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Monthly Contribution:</span>
                <span class="font-semibold text-green-600">{{ ((tontine.user_shares || 1) * tontine.contribution_amount).toLocaleString() }} RWF</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Members:</span>
                <span class="text-gray-800">{{ tontine.member_count || 0 }}/{{ tontine.max_members }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Total Saved:</span>
                <span class="font-semibold text-purple-600">{{ getTontineSavings(tontine.id).toLocaleString() }} RWF</span>
              </div>
            </div>
            <div class="mt-4 flex gap-2">
              <UButton @click="navigateTo(`/tontine-details?id=${tontine.id}`)" size="xs" class="flex-1">
                View Details
              </UButton>
              <UButton @click="navigateTo(`/manage?tontine=${tontine.id}`)" v-if="user?.role === 'admin'" size="xs" color="green" variant="outline">
                Manage
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards by Tontine -->
      <div v-if="userTontines.length > 0" class="mb-6 sm:mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Tontine Statistics</h2>
        <div v-for="tontine in userTontines" :key="tontine.id" class="mb-6">
          <h3 class="text-lg font-medium text-green-600 mb-3">{{ tontine.name }}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard class="border-0 shadow-lg">
              <div class="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <div>
                  <div class="font-semibold text-gray-900 dark:text-white">My Contributions</div>
                  <div class="text-sm text-gray-600 dark:text-slate-400">Total saved</div>
                </div>
                <div class="text-right">
                  <div class="text-xl font-bold text-green-600">RWF {{ getTontineSavings(tontine.id).toLocaleString() }}</div>
                </div>
              </div>
            </UCard>
            <UCard class="border-0 shadow-lg">
              <div class="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <div>
                  <div class="font-semibold text-gray-900 dark:text-white">Active Members</div>
                  <div class="text-sm text-gray-600 dark:text-slate-400">Currently joined</div>
                </div>
                <div class="text-right">
                  <div class="text-xl font-bold text-gray-700 dark:text-slate-300">{{ tontine.member_count || 0 }}/{{ tontine.max_members }}</div>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>

      <!-- Quick Actions by Tontine -->
      <div v-if="userTontines.length > 0" class="mb-6 sm:mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div v-for="tontine in userTontines" :key="tontine.id" class="mb-6">
          <h3 class="text-lg font-medium text-green-600 mb-3">{{ tontine.name }}</h3>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <button @click="navigateTo(`/contributions?tontine=${tontine.id}`)" class="h-16 sm:h-20 flex flex-col items-center justify-center text-xs sm:text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Icon name="i-heroicons-banknotes" class="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-gray-700 dark:text-slate-300" />
              <span class="text-center text-gray-900 dark:text-white">Make Contribution</span>
            </button>
            
            <button @click="navigateTo(`/loans?tontine=${tontine.id}`)" class="h-16 sm:h-20 flex flex-col items-center justify-center text-xs sm:text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Icon name="i-heroicons-document-text" class="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-gray-700 dark:text-slate-300" />
              <span class="text-center text-gray-900 dark:text-white">Request Loan</span>
            </button>
            
            <button @click="navigateTo(`/payments?tontine=${tontine.id}`)" class="h-16 sm:h-20 flex flex-col items-center justify-center text-xs sm:text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Icon name="i-heroicons-credit-card" class="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-gray-700 dark:text-slate-300" />
              <span class="text-center text-gray-900 dark:text-white">Payment History</span>
            </button>
            
            <button @click="navigateTo(`/reports?tontine=${tontine.id}`)" class="h-16 sm:h-20 flex flex-col items-center justify-center text-xs sm:text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <Icon name="i-heroicons-chart-bar" class="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-gray-700 dark:text-slate-300" />
              <span class="text-center text-gray-900 dark:text-white">View Reports</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <UCard class="border-0 shadow-lg">
          <div class="p-4 sm:p-6">
            <h3 class="text-base sm:text-lg font-semibold text-green-600 mb-3 sm:mb-4">Recent Activity</h3>
            <div v-if="loading" class="text-center py-4">
              <div class="text-gray-500">Loading activity...</div>
            </div>
            <div v-else class="space-y-3">
              <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-sm sm:text-base truncate text-gray-900 dark:text-white">Total Contributions</p>
                  <p class="text-xs sm:text-sm text-gray-600 dark:text-slate-400">All time</p>
                </div>
                <div class="text-green-600 font-semibold text-sm sm:text-base flex-shrink-0 ml-2">RWF {{ stats.totalContributions.toLocaleString() }}</div>
              </div>
              <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-sm sm:text-base truncate text-gray-900 dark:text-white">Active Members</p>
                  <p class="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Currently joined</p>
                </div>
                <div class="text-gray-700 dark:text-slate-300 font-semibold text-sm sm:text-base flex-shrink-0 ml-2">{{ stats.memberCount }}</div>
              </div>
            </div>
          </div>
        </UCard>

        <UCard class="border-0 shadow-lg">
          <div class="p-4 sm:p-6">
            <h3 class="text-base sm:text-lg font-semibold text-green-600 mb-3 sm:mb-4">Constitution Highlights</h3>
            <div class="space-y-3">
              <div class="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                <p class="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Maximum 20 Members</p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Article 7.a - Member limit</p>
              </div>
              <div class="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                <p class="font-medium text-gray-900 dark:text-white text-sm sm:text-base">20% Retention on Resignation</p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Article 8 - Resignation terms</p>
              </div>
              <div class="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                <p class="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Penalties Apply</p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Article 36 - Late payments & absences</p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
const userName = ref('Member')
const stats = ref({
  totalContributions: 0,
  activeTontines: 0,
  totalLoans: 0,
  memberCount: 0
})
const loading = ref(true)
const user = ref(null)
const userTontines = ref([])
const contributionsByTontine = ref({})

// Get user data and fetch dashboard data
onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
      
      // Validate user still exists in database
      try {
        const validateResponse = await fetch(`http://localhost:8000/api/auth/validate/${user.value.id}`)
        const validation = await validateResponse.json()
        
        if (!validation.exists) {
          // User no longer exists, clear localStorage and redirect to login
          localStorage.removeItem('user')
          localStorage.removeItem('token')
          await navigateTo('/login')
          return
        }
        
        userName.value = user.value.names || 'Member'
        await fetchDashboardData()
      } catch (error) {
        console.error('User validation failed:', error)
        // Clear localStorage and redirect on validation error
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        await navigateTo('/login')
      }
    } else {
      // No user data, redirect to login
      await navigateTo('/login')
    }
  }
})

const fetchDashboardData = async () => {
  try {
    // Fetch user tontines with shares
    const tontinesResponse = await fetch(`http://localhost:8000/api/tontines/user/${user.value.id}`)
    userTontines.value = await tontinesResponse.json()
    
    // Fetch user contributions
    const contributionsResponse = await fetch(`http://localhost:8000/api/contributions/user/${user.value.id}`)
    const contributions = await contributionsResponse.json()
    stats.value.totalContributions = contributions
      .filter(c => c.payment_status === 'Approved')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
    
    // Group contributions by tontine
    contributionsByTontine.value = contributions.reduce((acc, contrib) => {
      if (!acc[contrib.tontine_id]) {
        acc[contrib.tontine_id] = []
      }
      acc[contrib.tontine_id].push(contrib)
      return acc
    }, {})
    
    stats.value.activeTontines = userTontines.value.length
    
    // Fetch user loans
    const loansResponse = await fetch(`http://localhost:8000/api/loans/user/${user.value.id}`)
    const loans = await loansResponse.json()
    stats.value.totalLoans = loans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
    
    // Get total member count from all tontines
    try {
      const allTontinesResponse = await fetch('http://localhost:8000/api/tontines')
      const allTontines = await allTontinesResponse.json()
      
      if (allTontines.length > 0) {
        const tontineDetailsResponse = await fetch(`http://localhost:8000/api/tontines/${allTontines[0].id}`)
        const tontineDetails = await tontineDetailsResponse.json()
        stats.value.memberCount = tontineDetails.members?.length || 0
      }
    } catch (error) {
      console.error('Failed to fetch member count:', error)
    }
    
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  } finally {
    loading.value = false
  }
}

const getTontineSavings = (tontineId) => {
  const tontineContribs = contributionsByTontine.value[tontineId] || []
  return tontineContribs
    .filter(c => c.payment_status === 'Approved')
    .reduce((sum, c) => sum + c.amount, 0)
}


definePageMeta({
  layout: 'default'
})
</script>