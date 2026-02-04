<template>
  <div class="min-h-screen bg-white">
    <div>
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
          <div v-for="tontine in userTontines" :key="tontine.id" class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-4 shadow-sm hover:shadow-lg transition-all duration-200">
            <div class="flex justify-between items-start mb-3">
              <h3 class="font-semibold text-lg text-gray-800 dark:text-white">{{ tontine.name }}</h3>
              <UBadge :color="tontine.status === 'active' ? 'gray' : 'gray'" size="xs">
                {{ tontine.status }}
              </UBadge>
            </div>
            <p class="text-sm text-gray-600 dark:text-slate-400 mb-3">{{ tontine.description }}</p>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-slate-400">My Shares:</span>
                <span class="font-semibold text-blue-600">{{ tontine.user_shares || 1 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-slate-400">Monthly Contribution:</span>
                <span class="font-semibold text-gray-600 dark:text-slate-400">{{ ((tontine.user_shares || 1) * tontine.contribution_amount).toLocaleString() }} RWF</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-slate-400">Members:</span>
                <span class="text-gray-800 dark:text-white">{{ tontine.member_count || 0 }}/{{ tontine.max_members }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-slate-400">Total Saved:</span>
                <span class="font-semibold text-purple-600">RWF {{ Math.round(getTontineSavings(tontine.id)).toLocaleString() }}</span>
              </div>
            </div>
            <div class="mt-4 flex gap-2">
              <UButton @click="navigateTo(`/tontine-details?id=${tontine.id}`)" size="xs" color="gray" class="flex-1">
                View Details
              </UButton>
              <UButton @click="navigateTo(`/manage?tontine=${tontine.id}`)" v-if="user?.role === 'admin'" size="xs" color="gray" variant="outline">
                Manage
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Overview Charts -->
      <div class="mb-6 sm:mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Financial Overview</h2>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Total Saved Chart -->
          <UCard class="border-0 shadow-lg">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-green-600 mb-4">Total Saved</h3>
              <div class="h-48 flex items-center justify-center">
                <div class="relative w-32 h-32">
                  <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path class="text-gray-200 dark:text-slate-600" stroke="currentColor" stroke-width="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path class="text-green-600" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" :stroke-dasharray="`${Math.min((stats.totalContributions / 100000) * 100, 100)} 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="text-center">
                      <div class="text-lg font-bold text-green-600">{{ ((stats.totalContributions / 100000) * 100).toFixed(0) }}%</div>
                      <div class="text-xs text-gray-500">of 100K</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="text-center mt-4">
                <div class="text-2xl font-bold text-gray-900 dark:text-white">RWF {{ stats.totalContributions.toLocaleString() }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">All contributions</div>
              </div>
            </div>
          </UCard>

          <!-- Active Tontines Chart -->
          <UCard class="border-0 shadow-lg">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-blue-600 mb-4">Active Tontines</h3>
              <div class="h-48 flex items-center justify-center">
                <div class="text-center">
                  <div class="relative inline-block">
                    <div class="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                      <div class="text-3xl font-bold text-blue-600">{{ userTontines.length }}</div>
                    </div>
                    <div class="absolute -top-2 -right-2 w-8 h-8 bg-gray-500 dark:bg-slate-500 rounded-full flex items-center justify-center">
                      <Icon name="i-heroicons-check" class="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="text-center mt-4">
                <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ userTontines.length }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Currently joined</div>
              </div>
            </div>
          </UCard>

          <!-- Net Worth Chart -->
          <UCard class="border-0 shadow-lg">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-purple-600 mb-4">Net Worth</h3>
              <div class="h-48 flex items-center justify-center">
                <div class="w-full max-w-32">
                  <div class="space-y-3">
                    <!-- Savings Bar -->
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span class="text-gray-600 dark:text-slate-400">Savings</span>
                        <span class="text-gray-600 dark:text-slate-400">{{ stats.totalContributions.toLocaleString() }}</span>
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3">
                        <div class="bg-gray-600 dark:bg-slate-500 h-3 rounded-full" :style="{ width: stats.totalContributions > 0 ? '100%' : '0%' }"></div>
                      </div>
                    </div>
                    <!-- Loans Bar -->
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span class="text-red-600">Outstanding Loans</span>
                        <span class="text-red-600">{{ stats.totalLoans.toLocaleString() }}</span>
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3">
                        <div class="bg-red-600 h-3 rounded-full" :style="{ width: stats.totalLoans > 0 ? Math.min((stats.totalLoans / Math.max(stats.totalContributions, 1)) * 100, 100) + '%' : '0%' }"></div>
                      </div>
                    </div>
                    <!-- Loan Payments Bar -->
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span class="text-blue-600">Loan Payments</span>
                        <span class="text-blue-600">{{ stats.totalLoanPaid.toLocaleString() }}</span>
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3">
                        <div class="bg-blue-600 h-3 rounded-full" :style="{ width: stats.totalLoanPaid > 0 ? Math.min((stats.totalLoanPaid / Math.max(stats.totalContributions, 1)) * 100, 100) + '%' : '0%' }"></div>
                      </div>
                    </div>
                    <!-- Paid Penalties Bar -->
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span class="text-green-600">Paid Penalties</span>
                        <span class="text-green-600">{{ stats.penalties.paid.toLocaleString() }}</span>
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3">
                        <div class="bg-green-600 h-3 rounded-full" :style="{ width: stats.penalties.paid > 0 ? Math.min((stats.penalties.paid / Math.max(stats.totalContributions, 1)) * 100, 100) + '%' : '0%' }"></div>
                      </div>
                    </div>
                    <!-- Penalties Bar -->
                    <div>
                      <div class="flex justify-between text-xs mb-1">
                        <span class="text-red-600">Pending Penalties</span>
                        <span class="text-red-600">{{ stats.penalties.pending.toLocaleString() }}</span>
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3">
                        <div class="bg-red-600 h-3 rounded-full" :style="{ width: stats.penalties.pending > 0 ? Math.min((stats.penalties.pending / Math.max(stats.totalContributions, 1)) * 100, 100) + '%' : '0%' }"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="text-center mt-4">
                <div class="text-2xl font-bold text-gray-600 dark:text-slate-400">RWF {{ Math.max(0, (stats.totalContributions - stats.totalLoans - stats.penalties.pending)).toLocaleString() }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Savings - Outstanding Loans - Pending Penalties</div>
                <div class="text-xs text-orange-600 mt-1">Loan Requests: RWF {{ Math.round(stats.totalLoanRequested).toLocaleString() }}</div>
                <div class="text-xs text-red-600 mt-1">Pending Penalties: RWF {{ stats.penalties.pending.toLocaleString() }}</div>
                <div class="text-xs text-green-600 mt-1">Paid Penalties: RWF {{ stats.penalties.paid.toLocaleString() }}</div>
              </div>
            </div>
          </UCard>
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
                <div class="text-gray-600 dark:text-slate-400 font-semibold text-sm sm:text-base flex-shrink-0 ml-2">RWF {{ stats.totalContributions.toLocaleString() }}</div>
              </div>
              <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-sm sm:text-base truncate text-gray-900 dark:text-white">Loan Requests</p>
                  <p class="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Total requested</p>
                </div>
                <div class="text-orange-600 font-semibold text-sm sm:text-base flex-shrink-0 ml-2">RWF {{ stats.totalLoanRequested.toLocaleString() }}</div>
              </div>
              <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-sm sm:text-base truncate text-gray-900 dark:text-white">My Tontines</p>
                  <p class="text-xs sm:text-sm text-gray-600 dark:text-slate-400">Joined tontines</p>
                </div>
                <div class="text-blue-600 font-semibold text-sm sm:text-base flex-shrink-0 ml-2">{{ userTontines.length }}</div>
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
  totalLoanPaid: 0,
  totalLoanRequested: 0,
  memberCount: 0,
  penalties: {
    pending: 0,
    paid: 0,
    total: 0
  }
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
    
    // Fetch user loans and loan payments
    const loansResponse = await fetch(`http://localhost:8000/api/loans/user/${user.value.id}`)
    const loans = await loansResponse.json()
    
    // Fetch loan payments to calculate actual paid amounts
    const paymentsResponse = await fetch(`http://localhost:8000/api/payments/history/${user.value.id}`)
    const paymentsData = await paymentsResponse.json()
    const loanPayments = paymentsData.loanPayments || []
    
    // Calculate total loan amounts and total paid
    const totalLoanAmount = loans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
    const totalLoanPaid = loanPayments
      .filter(p => p.payment_status === 'Approved')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    
    stats.value.totalLoans = totalLoanAmount - totalLoanPaid // Net loan balance
    stats.value.totalLoanPaid = totalLoanPaid // Total paid amount
    stats.value.totalLoanRequested = totalLoanAmount // Total requested amount
    
    // Fetch penalty data
    const penaltiesResponse = await fetch(`http://localhost:8000/api/contributions/dashboard-stats/${user.value.id}`)
    const dashboardStats = await penaltiesResponse.json()
    stats.value.penalties = dashboardStats.penalties || { pending: 0, paid: 0, total: 0 }
    
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
  const total = tontineContribs
    .filter(c => c.payment_status === 'Approved')
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  return total || 0
}


definePageMeta({
  layout: 'default'
})
</script>