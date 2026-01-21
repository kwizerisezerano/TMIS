<template>
  <div class="space-y-6 p-4 sm:p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Reports</h1>
        <p class="text-gray-600">{{ user?.role === 'admin' ? 'View overall tontine reports and member activities' : 'View your tontine activities and reports' }}</p>
      </div>
    </div>

    <!-- Admin Reports -->
    <div v-if="user?.role === 'admin'">
      <!-- Overall Statistics -->
      <UCard class="mb-6">
        <template #header>
          <h3 class="text-lg font-semibold">Overall Tontine Statistics</h3>
        </template>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
            <div class="text-2xl font-bold text-gray-700 dark:text-slate-300">{{ overallStats.totalMembers }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Total Members</div>
          </div>
          <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
            <div class="text-2xl font-bold text-green-600">{{ formatCurrency(overallStats.totalContributions) }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Total Contributions</div>
          </div>
          <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
            <div class="text-2xl font-bold text-gray-700 dark:text-slate-300">{{ formatCurrency(overallStats.totalLoans) }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Total Loans</div>
          </div>
          <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
            <div class="text-2xl font-bold text-gray-700 dark:text-slate-300">{{ overallStats.activeMembers }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Active Members</div>
          </div>
        </div>
      </UCard>

      <!-- Member Activities -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Member Activities</h3>
        </template>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contributions</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loans</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="member in memberActivities" :key="member.id">
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ member.names }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatCurrency(member.total_contributions) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatCurrency(member.total_loans) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(member.last_activity) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span :class="member.email_verified ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {{ member.email_verified ? 'Active' : 'Pending' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Member Reports -->
    <div v-else>
      <!-- Personal Statistics -->
      <UCard class="mb-6">
        <template #header>
          <h3 class="text-lg font-semibold">Your Statistics</h3>
        </template>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
            <div class="text-2xl font-bold text-green-600">{{ formatCurrency(personalStats.totalContributions) }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Total Contributions</div>
          </div>
          <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
            <div class="text-2xl font-bold text-gray-700 dark:text-slate-300">{{ formatCurrency(personalStats.totalLoans) }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Total Loans</div>
          </div>
          <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
            <div class="text-2xl font-bold text-gray-700 dark:text-slate-300">{{ personalStats.contributionCount }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Contributions Made</div>
          </div>
        </div>
      </UCard>

      <!-- Recent Activities -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Your Recent Activities</h3>
        </template>
        
        <div class="space-y-4">
          <div v-for="activity in recentActivities" :key="activity.id" class="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="activity.type === 'contribution' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'">
                <Icon :name="activity.type === 'contribution' ? 'i-heroicons-banknotes' : 'i-heroicons-credit-card'" class="w-4 h-4" />
              </div>
              <div>
                <div class="font-medium text-gray-900">{{ activity.description }}</div>
                <div class="text-sm text-gray-500">{{ formatDate(activity.date) }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-medium text-gray-900">{{ formatCurrency(activity.amount) }}</div>
              <UBadge :color="activity.status === 'Completed' ? 'green' : activity.status === 'Pending' ? 'yellow' : 'red'" size="xs">
                {{ activity.status }}
              </UBadge>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default'
})

const { api } = useApi()
const user = ref(null)
const overallStats = ref({
  totalMembers: 0,
  totalContributions: 0,
  totalLoans: 0,
  activeMembers: 0
})
const memberActivities = ref([])
const personalStats = ref({
  totalContributions: 0,
  totalLoans: 0,
  contributionCount: 0
})
const recentActivities = ref([])

onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
      if (user.value.role === 'admin') {
        await fetchOverallStats()
        await fetchMemberActivities()
      } else {
        await fetchPersonalStats()
        await fetchRecentActivities()
      }
    }
  }
})

const fetchOverallStats = async () => {
  try {
    const [members, contributions, loans] = await Promise.all([
      api('/tontines/1/members'),
      api('/contributions/tontine/1'),
      api('/loans/tontine/1')
    ])
    
    overallStats.value = {
      totalMembers: members.length,
      totalContributions: contributions.reduce((sum, c) => sum + (c.amount || 0), 0),
      totalLoans: loans.reduce((sum, l) => sum + (l.amount || 0), 0),
      activeMembers: members.filter(m => m.email_verified).length
    }
  } catch (error) {
    console.error('Failed to fetch overall stats:', error)
  }
}

const fetchMemberActivities = async () => {
  try {
    const members = await api('/tontines/1/members')
    const contributions = await api('/contributions/tontine/1')
    const loans = await api('/loans/tontine/1')
    
    memberActivities.value = members.map(member => {
      const memberContributions = contributions.filter(c => c.user_id === member.id)
      const memberLoans = loans.filter(l => l.user_id === member.id)
      
      return {
        ...member,
        total_contributions: memberContributions.reduce((sum, c) => sum + (c.amount || 0), 0),
        total_loans: memberLoans.reduce((sum, l) => sum + (l.amount || 0), 0),
        last_activity: memberContributions.length > 0 ? memberContributions[0].contribution_date : member.created_at
      }
    })
  } catch (error) {
    console.error('Failed to fetch member activities:', error)
  }
}

const fetchPersonalStats = async () => {
  try {
    const [contributions, loans] = await Promise.all([
      api(`/contributions/user/${user.value.id}`),
      api(`/loans/user/${user.value.id}`)
    ])
    
    personalStats.value = {
      totalContributions: contributions.reduce((sum, c) => sum + (c.amount || 0), 0),
      totalLoans: loans.reduce((sum, l) => sum + (l.amount || 0), 0),
      contributionCount: contributions.length
    }
  } catch (error) {
    console.error('Failed to fetch personal stats:', error)
  }
}

const fetchRecentActivities = async () => {
  try {
    const [contributions, loans] = await Promise.all([
      api(`/contributions/user/${user.value.id}`),
      api(`/loans/user/${user.value.id}`)
    ])
    
    const activities = [
      ...contributions.map(c => ({
        id: `c-${c.id}`,
        type: 'contribution',
        description: 'Contribution Payment',
        amount: c.amount,
        date: c.contribution_date,
        status: c.payment_status
      })),
      ...loans.map(l => ({
        id: `l-${l.id}`,
        type: 'loan',
        description: 'Loan Request',
        amount: l.amount,
        date: l.created_at,
        status: l.status
      }))
    ]
    
    recentActivities.value = activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
  } catch (error) {
    console.error('Failed to fetch recent activities:', error)
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF'
  }).format(amount || 0)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-RW')
}
</script>