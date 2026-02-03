<template>
  <div class="min-h-screen bg-white">
    <div>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-green-600">Monthly Contributions</h1>
          <p class="text-gray-600">Select a tontine to manage contributions</p>
        </div>
        <UButton @click="navigateTo('/dashboard')" variant="outline" icon="i-heroicons-arrow-left">
          Back to Dashboard
        </UButton>
      </div>

      <!-- Tontine Selection -->
      <UCard class="mb-8 shadow-lg" v-if="!selectedTontine">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-green-600 mb-4">Select Tontine</h2>
          <div v-if="loadingTontines" class="text-center py-8">
            <div class="text-gray-500">Loading tontines...</div>
          </div>
          <div v-else-if="userTontines.length === 0" class="text-center py-8">
            <div class="text-gray-500">No active tontines found</div>
          </div>
          <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="tontine in userTontines" :key="tontine.id" 
                 @click="selectTontine(tontine)"
                 class="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-colors border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800">
              <h3 class="font-semibold text-lg">{{ tontine.name }}</h3>
              <p class="text-sm text-gray-600 mb-2">{{ tontine.description }}</p>
              <div class="text-green-600 font-semibold">
                {{ ((tontine.user_shares || 1) * tontine.contribution_amount).toLocaleString() }} RWF/month
              </div>
              <div class="text-xs text-gray-500">{{ tontine.user_shares || 1 }} shares</div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Current Month Contribution -->
      <UCard class="mb-8 shadow-lg" v-if="selectedTontine">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-green-600">{{ selectedTontine.name }} - January 2025 Contribution</h2>
            <UButton @click="selectedTontine = null" variant="outline" size="xs">
              Change Tontine
            </UButton>
          </div>
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="text-2xl font-bold text-green-600">RWF {{ monthlyAmount.toLocaleString() }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Required Monthly Amount</div>
              </div>
            </div>
            <div>
              <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="text-2xl font-bold text-yellow-600">Due: Jan 17, 2025</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Payment Deadline</div>
              </div>
            </div>
          </div>
          
          <div class="mt-6">
            <button @click="showPaymentModal = true" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 text-lg font-medium">
              <Icon name="i-heroicons-banknotes" class="w-5 h-5" />
              Make Payment - RWF {{ monthlyAmount.toLocaleString() }}
            </button>
          </div>
        </div>
      </UCard>

      <!-- Penalty Information -->
      <UCard class="mb-8 shadow-lg" v-if="selectedTontine">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-red-600 mb-4">Payment Penalties (Article 36)</h2>
          <div class="grid md:grid-cols-3 gap-4">
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div class="font-semibold text-red-700 dark:text-red-400">10th - 17th of Month</div>
              <div class="text-sm text-gray-600 dark:text-slate-400">{{ (monthlyAmount * 0.05).toLocaleString() }} RWF fine (5% of contribution)</div>
            </div>
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div class="font-semibold text-red-700 dark:text-red-400">After 17th of Month</div>
              <div class="text-sm text-gray-600 dark:text-slate-400">1% of monthly contribution ({{ Math.round(monthlyAmount * 0.01).toLocaleString() }} RWF)</div>
            </div>
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div class="font-semibold text-red-700 dark:text-red-400">3 Months Late</div>
              <div class="text-sm text-gray-600 dark:text-slate-400">Automatic expulsion</div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Contribution History -->
      <UCard class="shadow-lg" v-if="selectedTontine">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-green-600 mb-4">{{ selectedTontine.name }} - Contribution History</h2>
          <div v-if="loading" class="text-center py-8">
            <div class="text-gray-500">Loading contributions...</div>
          </div>
          <div v-else-if="contributions.length === 0" class="text-center py-8">
            <div class="text-gray-500">No contributions found</div>
          </div>
          <div v-else class="space-y-3">
            <div v-for="contribution in contributions" :key="contribution.id" 
                 class="flex justify-between items-center p-4 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <div>
                <div class="font-semibold">{{ formatDate(contribution.contribution_date) }}</div>
                <div class="text-sm text-gray-600">{{ formatPaymentMethod(contribution.payment_method) || 'Mobile Money' }}</div>
              </div>
              <div class="text-right">
                <div class="font-semibold" :class="{
                  'text-green-600': contribution.payment_status === 'Approved',
                  'text-yellow-600': contribution.payment_status === 'Pending',
                  'text-red-600': contribution.payment_status === 'Failed'
                }">RWF {{ Number(contribution.amount).toLocaleString() }}</div>
                <div class="text-xs" :class="{
                  'text-green-600': contribution.payment_status === 'Approved',
                  'text-yellow-600': contribution.payment_status === 'Pending',
                  'text-red-600': contribution.payment_status === 'Failed'
                }">
                  {{ contribution.payment_status === 'Approved' ? '✓ Approved' : contribution.payment_status }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Payment Modal -->
    <UModal v-model="showPaymentModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-green-600">Make Monthly Contribution</h3>
        </template>
        
        <div class="space-y-4">
          <div class="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
            <div class="text-xl font-bold text-green-600">RWF {{ monthlyAmount.toLocaleString() }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">January 2025 Monthly Contribution</div>
          </div>
          
          <UFormGroup label="Payment Method">
            <USelect v-model="paymentMethod" :options="paymentOptions" />
          </UFormGroup>
          
          <UFormGroup label="Phone Number" v-if="paymentMethod === 'mobile_money'">
            <UInput v-model="phoneNumber" placeholder="0781234567" />
          </UFormGroup>
          
          <div v-if="paymentStatus" class="bg-blue-50 p-3 rounded-lg">
            <div class="text-sm text-blue-700">{{ paymentStatus }}</div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showPaymentModal = false" variant="outline">Cancel</UButton>
            <UButton @click="processPayment" color="green" :loading="paymentLoading">
              Pay RWF {{ monthlyAmount.toLocaleString() }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { io } from 'socket.io-client'

const showPaymentModal = ref(false)
const paymentLoading = ref(false)
const paymentMethod = ref('mobile_money')
const phoneNumber = ref('')
const loading = ref(true)
const loadingTontines = ref(true)
const contributions = ref([])
const user = ref(null)
const selectedTontine = ref(null)
const userTontines = ref([])
const monthlyAmount = ref(20000)
const socket = ref(null)
const paymentStatus = ref('')

const paymentOptions = [
  { label: 'Mobile Money', value: 'mobile_money' },
  { label: 'Bank Transfer', value: 'bank' },
  { label: 'Cash', value: 'cash' }
]

// Initialize Socket.io connection
const initSocket = () => {
  if (process.client && !socket.value) {
    socket.value = io('http://localhost:8000')
    
    // Join tontine room for real-time updates
    if (selectedTontine.value?.id) {
      socket.value.emit('join-tontine', selectedTontine.value.id)
    }
    
    // Listen for payment status updates
    socket.value.on('payment-status-updated', (data) => {
      if (data.userId === user.value?.id) {
        const toast = useToast()
        
        // Update contribution in the list
        const contributionIndex = contributions.value.findIndex(c => c.id === data.contributionId)
        if (contributionIndex !== -1) {
          contributions.value[contributionIndex].payment_status = data.status
        }
        
        toast.add({
          title: data.status === 'Approved' ? '✅ Payment Confirmed!' : '❌ Payment Failed',
          description: data.message,
          color: data.status === 'Approved' ? 'green' : 'red'
        })
      }
    })
    
    // Listen for payment status updates
    socket.value.on('payment-status', (data) => {
      if (data.userId === user.value?.id) {
        const toast = useToast()
        
        switch (data.status) {
          case 'initiated':
            paymentStatus.value = 'Processing payment...'
            toast.add({
              title: '🔄 Payment Processing',
              description: data.message,
              color: 'blue'
            })
            break
          case 'completed':
            paymentStatus.value = 'Payment completed'
            toast.add({
              title: '✅ Payment Successful!',
              description: data.message,
              color: 'green'
            })
            fetchContributions() // Refresh data
            break
          case 'failed':
            paymentStatus.value = 'Payment failed'
            toast.add({
              title: '❌ Payment Failed',
              description: data.message,
              color: 'red'
            })
            break
          case 'error':
            paymentStatus.value = 'Payment error'
            toast.add({
              title: '⚠️ Payment Error',
              description: data.message,
              color: 'red'
            })
            break
        }
      }
    })
    
    // Listen for contribution updates
    socket.value.on('contribution-received', (data) => {
      fetchContributions() // Refresh contributions list
    })
  }
}

// Get user data and fetch contributions
onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
      await fetchUserTontines()
      
      // Auto-select tontine from URL parameter
      const route = useRoute()
      if (route.query.tontine) {
        const tontine = userTontines.value.find(t => t.id == route.query.tontine)
        if (tontine) {
          selectTontine(tontine)
        }
      }
    }
  }
})

// Cleanup socket connection
onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect()
  }
})

const fetchUserTontines = async () => {
  try {
    loadingTontines.value = true
    const response = await fetch(`http://localhost:8000/api/tontines/user/${user.value.id}`)
    userTontines.value = await response.json()
  } catch (error) {
    console.error('Failed to fetch user tontines:', error)
  } finally {
    loadingTontines.value = false
  }
}

const selectTontine = async (tontine) => {
  selectedTontine.value = tontine
  monthlyAmount.value = (tontine.user_shares || 1) * tontine.contribution_amount
  await fetchContributions()
  initSocket()
}

const fetchContributions = async () => {
  if (!selectedTontine.value) return
  
  try {
    const response = await fetch(`http://localhost:8000/api/contributions/tontine/${selectedTontine.value.id}`)
    const data = await response.json()
    // Filter to show only current user's contributions
    contributions.value = data.filter(c => c.user_id === user.value.id)
  } catch (error) {
    console.error('Failed to fetch contributions:', error)
  } finally {
    loading.value = false
  }
}

const processPayment = async () => {
  paymentLoading.value = true
  
  try {
    const response = await fetch('http://localhost:8000/api/payments/contribution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: user.value.id,
        tontineId: selectedTontine.value?.id,
        amount: monthlyAmount.value,
        paymentMethod: paymentMethod.value,
        paymentData: {
          phone: phoneNumber.value,
          description: `Monthly contribution for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
        }
      })
    })
    
    const result = await response.json()
    
    const toast = useToast()
    if (result.success) {
      toast.add({
        title: '✅ Payment Successful!',
        description: `Your ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} contribution has been processed`,
        color: 'green'
      })
      
      showPaymentModal.value = false
      await fetchContributions() // Refresh data
      
      // Trigger auto-refresh
      localStorage.setItem('auto-refresh-trigger', Date.now().toString())
      window.dispatchEvent(new CustomEvent('auto-refresh'))
    } else {
      toast.add({
        title: '❌ Payment Failed',
        description: result.message || 'Please try again or contact support',
        color: 'red'
      })
    }
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: '❌ Payment Failed',
      description: 'Network error. Please try again or contact support',
      color: 'red'
    })
  } finally {
    paymentLoading.value = false
  }
}

const formatPaymentMethod = (method) => {
  if (!method) return 'Mobile Money'
  
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

// Format date helper
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

definePageMeta({
  layout: 'default'
})
</script>