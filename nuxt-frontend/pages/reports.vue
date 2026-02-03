<template>
  <div class="min-h-screen bg-white dark:bg-slate-900 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-bold text-green-600">📊 Financial Reports</h1>
          <p class="text-gray-600 dark:text-slate-400">
            {{ isAdmin ? 'Tontine-wide analytics and insights' : 'Your personal financial analytics' }}
          </p>
        </div>
        <div class="flex gap-2" v-if="isAdmin">
          <select v-model="selectedTontine" @change="fetchReportsData" class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
            <option value="">All Tontines</option>
            <option v-for="tontine in tontines" :key="tontine.id" :value="tontine.id">
              {{ tontine.name }}
            </option>
          </select>
          <UButton @click="exportData" color="green" variant="outline" size="sm">
            Export Data
          </UButton>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <UCard class="border-0 shadow-lg">
          <div class="p-6 text-center">
            <div class="text-3xl font-bold text-green-600">RWF {{ stats.totalContributions.toLocaleString() }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {{ isAdmin ? 'Total Contributions' : 'My Contributions' }}
            </div>
            <div class="text-xs text-green-600 mt-2">{{ stats.contributionCount }} transactions</div>
          </div>
        </UCard>
        
        <UCard class="border-0 shadow-lg">
          <div class="p-6 text-center">
            <div class="text-3xl font-bold text-orange-600">RWF {{ stats.totalLoanRequested.toLocaleString() }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {{ isAdmin ? 'Loans Requested' : 'My Loan Requests' }}
            </div>
            <div class="text-xs text-orange-600 mt-2">{{ stats.activeLoans }} active</div>
          </div>
        </UCard>
        
        <UCard class="border-0 shadow-lg">
          <div class="p-6 text-center">
            <div class="text-3xl font-bold text-blue-600">RWF {{ stats.totalLoanPaid.toLocaleString() }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {{ isAdmin ? 'Loan Payments' : 'My Loan Payments' }}
            </div>
            <div class="text-xs text-blue-600 mt-2">{{ stats.paymentRate }}% repayment rate</div>
          </div>
        </UCard>
        
        <UCard class="border-0 shadow-lg">
          <div class="p-6 text-center">
            <div class="text-3xl font-bold text-purple-600">{{ isAdmin ? stats.totalMembers : userTontines.length }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {{ isAdmin ? 'Total Members' : 'My Tontines' }}
            </div>
            <div class="text-xs text-purple-600 mt-2">{{ isAdmin ? tontines.length + ' tontines' : 'Active memberships' }}</div>
          </div>
        </UCard>
      </div>

      <!-- Detailed Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Contributions -->
        <UCard class="border-0 shadow-lg">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-green-600 mb-4">Recent Contributions</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-slate-600">
                    <th class="text-left py-2 text-gray-600 dark:text-slate-400">Date</th>
                    <th class="text-left py-2 text-gray-600 dark:text-slate-400" v-if="isAdmin">Member</th>
                    <th class="text-left py-2 text-gray-600 dark:text-slate-400" v-else>Purpose</th>
                    <th class="text-right py-2 text-gray-600 dark:text-slate-400">Amount</th>
                    <th class="text-center py-2 text-gray-600 dark:text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="contribution in recentContributions" :key="contribution.id" class="border-b border-gray-100 dark:border-slate-700">
                    <td class="py-2 text-gray-900 dark:text-white">{{ formatDate(contribution.created_at) }}</td>
                    <td class="py-2 text-gray-900 dark:text-white">{{ isAdmin ? (contribution.user_name || 'N/A') : 'Monthly Contribution' }}</td>
                    <td class="py-2 text-right font-semibold text-green-600">RWF {{ contribution.amount.toLocaleString() }}</td>
                    <td class="py-2 text-center">
                      <UBadge :color="getStatusColor(contribution.payment_status)" size="xs">
                        {{ contribution.payment_status }}
                      </UBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </UCard>

        <!-- Recent Loans -->
        <UCard class="border-0 shadow-lg">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-orange-600 mb-4">Recent Loan Requests</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-slate-600">
                    <th class="text-left py-2 text-gray-600 dark:text-slate-400">Date</th>
                    <th class="text-left py-2 text-gray-600 dark:text-slate-400" v-if="isAdmin">Member</th>
                    <th class="text-left py-2 text-gray-600 dark:text-slate-400" v-else>Purpose</th>
                    <th class="text-right py-2 text-gray-600 dark:text-slate-400">Amount</th>
                    <th class="text-center py-2 text-gray-600 dark:text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="loan in recentLoans" :key="loan.id" class="border-b border-gray-100 dark:border-slate-700">
                    <td class="py-2 text-gray-900 dark:text-white">{{ formatDate(loan.created_at) }}</td>
                    <td class="py-2 text-gray-900 dark:text-white">{{ isAdmin ? (loan.user_name || 'N/A') : 'Loan Request' }}</td>
                    <td class="py-2 text-right font-semibold text-orange-600">RWF {{ loan.amount.toLocaleString() }}</td>
                    <td class="py-2 text-center">
                      <UBadge :color="getStatusColor(loan.status)" size="xs">
                        {{ loan.status }}
                      </UBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup>
const stats = ref({
  totalContributions: 0,
  totalLoanRequested: 0,
  totalLoanPaid: 0,
  contributionCount: 0,
  activeLoans: 0,
  paymentRate: 0,
  totalMembers: 0
})

const recentContributions = ref([])
const recentLoans = ref([])
const user = ref(null)
const tontines = ref([])
const userTontines = ref([])
const selectedTontine = ref('')
const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'president')

onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
      if (isAdmin.value) {
        await fetchTontines()
        
        // Check for tontine query parameter
        const route = useRoute()
        if (route.query.tontine) {
          selectedTontine.value = route.query.tontine
        }
      }
      await fetchReportsData()
    } else {
      await navigateTo('/login')
    }
  }
})

const fetchTontines = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/tontines')
    tontines.value = await response.json()
  } catch (error) {
    console.error('Failed to fetch tontines:', error)
  }
}

const fetchReportsData = async () => {
  try {
    if (isAdmin.value) {
      await fetchAdminReports()
    } else {
      await fetchUserReports()
    }
  } catch (error) {
    console.error('Failed to fetch reports data:', error)
  }
}

const fetchAdminReports = async () => {
  try {
    const contributionsResponse = await fetch('http://localhost:8000/api/contributions')
    const allContributions = await contributionsResponse.json()
    
    const loansResponse = await fetch('http://localhost:8000/api/loans')
    const allLoans = await loansResponse.json()
    
    const loanPaymentsResponse = await fetch('http://localhost:8000/api/payments/loan-payments/all')
    const allLoanPayments = await loanPaymentsResponse.json()
    
    const contributions = selectedTontine.value 
      ? allContributions.filter(c => c.tontine_id == selectedTontine.value)
      : allContributions
    
    const loans = selectedTontine.value
      ? allLoans.filter(l => l.tontine_id == selectedTontine.value)
      : allLoans
    
    const loanPayments = selectedTontine.value
      ? allLoanPayments.filter(p => p.tontine_id == selectedTontine.value)
      : allLoanPayments
    
    stats.value.totalContributions = contributions
      .filter(c => c.payment_status === 'Approved')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
    
    stats.value.contributionCount = contributions.length
    stats.value.totalLoanRequested = loans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
    stats.value.activeLoans = loans.filter(l => l.status === 'Approved').length
    
    stats.value.totalLoanPaid = loanPayments
      .filter(p => p.payment_status === 'Approved')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    
    stats.value.paymentRate = stats.value.totalLoanRequested > 0 
      ? Math.round((stats.value.totalLoanPaid / stats.value.totalLoanRequested) * 100) 
      : 0
    
    if (selectedTontine.value) {
      const tontineResponse = await fetch(`http://localhost:8000/api/tontines/${selectedTontine.value}`)
      const tontineData = await tontineResponse.json()
      stats.value.totalMembers = tontineData.members?.length || 0
    } else {
      let totalMembers = 0
      for (const tontine of tontines.value) {
        const tontineResponse = await fetch(`http://localhost:8000/api/tontines/${tontine.id}`)
        const tontineData = await tontineResponse.json()
        totalMembers += tontineData.members?.length || 0
      }
      stats.value.totalMembers = totalMembers
    }
    
    recentContributions.value = contributions.slice(0, 5)
    recentLoans.value = loans.slice(0, 5)
  } catch (error) {
    console.error('Failed to fetch admin reports:', error)
  }
}

const fetchUserReports = async () => {
  try {
    const contributionsResponse = await fetch(`http://localhost:8000/api/contributions/user/${user.value.id}`)
    const contributions = await contributionsResponse.json()
    
    const loansResponse = await fetch(`http://localhost:8000/api/loans/user/${user.value.id}`)
    const loans = await loansResponse.json()
    
    const paymentsResponse = await fetch(`http://localhost:8000/api/payments/history/${user.value.id}`)
    const paymentsData = await paymentsResponse.json()
    
    stats.value.totalContributions = contributions
      .filter(c => c.payment_status === 'Approved')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
    
    stats.value.contributionCount = contributions.length
    stats.value.totalLoanRequested = loans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
    stats.value.activeLoans = loans.filter(l => l.status === 'Approved').length
    
    const loanPayments = paymentsData.loanPayments || []
    stats.value.totalLoanPaid = loanPayments
      .filter(p => p.payment_status === 'Approved')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    
    stats.value.paymentRate = stats.value.totalLoanRequested > 0 
      ? Math.round((stats.value.totalLoanPaid / stats.value.totalLoanRequested) * 100) 
      : 0
    
    recentContributions.value = contributions.slice(0, 5)
    recentLoans.value = loans.slice(0, 5)
    
    const tontinesResponse = await fetch(`http://localhost:8000/api/tontines/user/${user.value.id}`)
    userTontines.value = await tontinesResponse.json()
  } catch (error) {
    console.error('Failed to fetch user reports:', error)
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved': return 'green'
    case 'pending': return 'yellow'
    case 'rejected': return 'red'
    default: return 'gray'
  }
}

const exportData = () => {
  const data = recentContributions.value.concat(recentLoans.value)
  const headers = ['Date', 'Type', 'Amount', 'Status']
  
  let csv = headers.join(',') + '\n'
  data.forEach(item => {
    const row = [
      formatDate(item.created_at),
      item.tontine_name ? 'Contribution' : 'Loan',
      item.amount,
      item.payment_status || item.status
    ]
    csv += row.join(',') + '\n'
  })
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reports_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

definePageMeta({
  layout: 'default'
})
</script>