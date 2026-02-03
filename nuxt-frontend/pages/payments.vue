<template>
  <div class="min-h-screen bg-white dark:bg-slate-900">
    <div>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-green-600">Payment History</h1>
          <p class="text-gray-600 dark:text-slate-400">Track all your contributions and loan payments</p>
        </div>
        <UButton @click="navigateTo('/dashboard')" variant="outline">
          Back to Dashboard
        </UButton>
      </div>

      <!-- Payment Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UCard class="border-0 shadow-lg">
          <div class="text-center p-4">
            <div v-if="loading" class="text-xl text-gray-400">Loading...</div>
            <div v-else class="text-2xl font-bold text-green-600">RWF {{ totalContributions.toLocaleString() }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Total Contributions</div>
          </div>
        </UCard>
        
        <UCard class="border-0 shadow-lg">
          <div class="text-center p-4">
            <div v-if="loading" class="text-xl text-gray-400">Loading...</div>
            <div v-else class="text-2xl font-bold text-blue-600">RWF {{ totalLoanPayments.toLocaleString() }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Total Loan Payments</div>
          </div>
        </UCard>
        
        <UCard class="border-0 shadow-lg">
          <div class="text-center p-4">
            <div class="text-2xl font-bold text-purple-600">{{ totalTransactions }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Total Transactions</div>
          </div>
        </UCard>
      </div>

      <!-- Payment Tabs -->
      <div class="mb-6">
        <div class="flex space-x-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
          <button 
            @click="activeTab = 'contributions'" 
            :class="activeTab === 'contributions' ? 'bg-white dark:bg-slate-600 text-green-600 shadow' : 'text-gray-600 dark:text-slate-400'"
            class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            Contributions
          </button>
          <button 
            @click="activeTab = 'loans'" 
            :class="activeTab === 'loans' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-600 dark:text-slate-400'"
            class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            Loan Payments
          </button>
        </div>
      </div>

      <!-- Contributions Tab -->
      <div v-if="activeTab === 'contributions'">
        <UCard class="border-0 shadow-lg">
          <div class="p-6">
            <h2 class="text-xl font-semibold text-green-600 mb-4">Contribution History</h2>
            <div v-if="loading" class="text-center py-8">
              <div class="text-gray-500">Loading contributions...</div>
            </div>
            <div v-else-if="contributions.length === 0" class="text-center py-8">
              <div class="text-gray-500">No contributions found</div>
            </div>
            <div v-else class="space-y-3">
              <div v-for="contribution in contributions" :key="contribution.id" 
                   class="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                <div>
                  <div class="font-semibold text-gray-900 dark:text-white">{{ contribution.tontine_name }}</div>
                  <div class="text-sm text-gray-600 dark:text-slate-400">{{ formatDate(contribution.contribution_date) }}</div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-green-600">RWF {{ parseFloat(contribution.amount).toLocaleString() }}</div>
                  <div class="text-xs" :class="getStatusClass(contribution.payment_status)">
                    {{ contribution.payment_status }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-slate-400">{{ formatPaymentMethod(contribution.payment_method) }}</div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Loan Payments Tab -->
      <div v-if="activeTab === 'loans'">
        <UCard class="border-0 shadow-lg">
          <div class="p-6">
            <h2 class="text-xl font-semibold text-blue-600 mb-4">Loan Payment History</h2>
            <div v-if="loading" class="text-center py-8">
              <div class="text-gray-500">Loading loan payments...</div>
            </div>
            <div v-else-if="loanPayments.length === 0" class="text-center py-8">
              <div class="text-gray-500">No loan payments found</div>
            </div>
            <div v-else class="space-y-3">
              <div v-for="payment in loanPayments" :key="payment.id" 
                   class="flex justify-between items-center p-4 rounded-lg border bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                <div>
                  <div class="font-semibold text-gray-900 dark:text-white">{{ payment.tontine_name }}</div>
                  <div class="text-sm text-gray-600 dark:text-slate-400">{{ formatDate(payment.payment_date) }}</div>
                  <div class="text-xs text-gray-500 dark:text-slate-400">Loan Amount: RWF {{ parseFloat(payment.amount).toLocaleString() }}</div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold" :class="{
                    'text-green-600': payment.payment_status === 'Approved',
                    'text-yellow-600': payment.payment_status === 'Pending', 
                    'text-red-600': payment.payment_status === 'Failed'
                  }">RWF {{ parseFloat(payment.amount).toLocaleString() }}</div>
                  <div class="text-xs" :class="getStatusClass(payment.payment_status)">
                    {{ payment.payment_status }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Export Options -->
      <div class="mt-8 text-center">
        <UButton @click="exportPaymentHistory" color="gray" variant="outline" size="sm">
          Export Payment History
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
const activeTab = ref('contributions')
const loading = ref(true)
const contributions = ref([])
const loanPayments = ref([])
const user = ref(null)

const totalContributions = computed(() => {
  return contributions.value.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
})

const totalLoanPayments = computed(() => {
  return loanPayments.value.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
})

const totalTransactions = computed(() => {
  return contributions.value.length + loanPayments.value.length
})

onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
      await fetchPaymentHistory()
    }
  }
})

const fetchPaymentHistory = async () => {
  try {
    const response = await fetch(`http://localhost:8000/api/payments/history/${user.value.id}`)
    const data = await response.json()
    
    contributions.value = data.contributions || []
    loanPayments.value = data.loanPayments || []
    
  } catch (error) {
    console.error('Failed to fetch payment history:', error)
    const toast = useToast()
    toast.add({
      title: '❌ Error',
      description: 'Failed to load payment history',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const formatPaymentMethod = (method) => {
  if (!method) return 'N/A'
  
  const methodMap = {
    'mobile_money': 'Mobile Money',
    'bank_transfer': 'Bank Transfer',
    'cash': 'Cash',
    'card': 'Card Payment',
    'stripe': 'Stripe',
    'paypal': 'PayPal'
  }
  
  return methodMap[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStatusClass = (status) => {
  switch (status) {
    case 'Approved': return 'text-green-600'
    case 'Pending': return 'text-yellow-600'
    case 'Failed': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

const exportPaymentHistory = () => {
  try {
    // Create CSV content
    let csvContent = 'Type,Tontine,Date,Amount,Status,Payment Method\n'
    
    // Add contributions
    contributions.value.forEach(c => {
      csvContent += `Contribution,"${c.tontine_name}",${c.contribution_date},${c.amount},${c.payment_status},${formatPaymentMethod(c.payment_method)}\n`
    })
    
    // Add loan payments
    loanPayments.value.forEach(p => {
      csvContent += `Loan Payment,"${p.tontine_name}",${p.payment_date},${p.amount},${p.payment_status},${formatPaymentMethod(p.payment_method)}\n`
    })
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    
    const toast = useToast()
    toast.add({
      title: '✅ Export Complete',
      description: 'Payment history downloaded successfully',
      color: 'green'
    })
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: '❌ Export Failed',
      description: 'Failed to export payment history',
      color: 'red'
    })
  }
}

definePageMeta({
  layout: 'default'
})
</script>