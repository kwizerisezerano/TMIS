<template>
  <div class="min-h-screen bg-white">
    <div>
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-blue-600">Loan Management</h1>
          <p class="text-gray-600">Select a tontine to manage loans</p>
        </div>
        <UButton @click="navigateTo('/dashboard')" variant="outline" icon="i-heroicons-arrow-left">
          Back to Dashboard
        </UButton>
      </div>

      <!-- Tontine Selection -->
      <UCard class="mb-8 shadow-lg" v-if="!selectedTontine">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-blue-600 mb-4">Select Tontine</h2>
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
              <div class="text-blue-600 font-semibold">
                Max Loan: {{ Math.floor(getTontineContributions(tontine.id) * 2 / 3).toLocaleString() }} RWF
              </div>
              <div class="text-xs text-gray-500">{{ tontine.user_shares || 1 }} shares</div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Loan Eligibility -->
      <UCard class="mb-8 border-0 shadow-lg" v-if="selectedTontine">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-blue-600">{{ selectedTontine.name }} - Loan Eligibility</h2>
            <UButton @click="selectedTontine = null" variant="outline" size="xs">
              Change Tontine
            </UButton>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div class="text-2xl font-bold text-gray-700 dark:text-slate-300">RWF {{ userContributions.toLocaleString() }}</div>
              <div class="text-sm text-gray-600 dark:text-slate-400">Your Total Contributions</div>
            </div>
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div class="text-2xl font-bold text-green-600">RWF {{ maxLoanAmount.toLocaleString() }}</div>
              <div class="text-sm text-gray-600 dark:text-slate-400">Maximum Loan (2/3 of contributions)</div>
            </div>
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div class="text-2xl font-bold text-yellow-600">1.7%</div>
              <div class="text-sm text-gray-600 dark:text-slate-400">Monthly Interest Rate</div>
            </div>
          </div>
          
          <div class="mt-6">
            <UButton @click="showLoanModal = true" color="blue" size="lg" icon="i-heroicons-document-text" :disabled="hasActiveLoan">
              {{ hasActiveLoan ? 'Active Loan Exists' : 'Request New Loan' }}
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Loan Terms (Article 28) -->
      <UCard class="mb-8 border-0 shadow-lg">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-blue-600 mb-4">Loan Terms (Article 28)</h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="font-semibold text-gray-900 dark:text-white">Maximum Amount</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">2/3 of your base share contributions</div>
              </div>
              <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="font-semibold text-green-700 dark:text-green-400">Interest Rate</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">1.7% per month</div>
              </div>
            </div>
            <div class="space-y-4">
              <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="font-semibold text-yellow-700 dark:text-yellow-400">Repayment Period</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Maximum 6 months</div>
              </div>
              <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="font-semibold text-red-700 dark:text-red-400">Late Payment Penalty</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">3.4% per month after 3 months</div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Active Loan -->
      <UCard v-if="activeLoan" class="mb-8 border-0 shadow-lg">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-orange-600 mb-4">Active Loan</h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <div class="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
                <div class="text-2xl font-bold text-orange-600">RWF {{ parseFloat(activeLoan.amount).toLocaleString() }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Loan Amount</div>
              </div>
            </div>
            <div>
              <div class="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
                <div class="text-2xl font-bold text-red-600">RWF {{ calculateRemainingBalance(activeLoan).toLocaleString() }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Total Amount Due (Principal + Interest)</div>
              </div>
            </div>
          </div>
          
          <div class="mt-6 grid md:grid-cols-2 gap-4">
            <div class="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
              <div class="font-semibold">Loan Status</div>
              <div class="text-sm text-gray-600">{{ activeLoan.status }}</div>
              <div class="text-lg font-bold text-blue-600">RWF {{ calculateRemainingBalance(activeLoan).toLocaleString() }}</div>
              <div class="text-xs text-gray-500">Total Amount Due</div>
            </div>
            <div class="flex items-center">
              <UButton @click="showPaymentModal = true" color="orange" size="lg">
                Make Loan Payment
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Loan Request History -->
      <UCard class="border-0 shadow-lg">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-blue-600 mb-4">Loan Request History</h2>
          <div v-if="loading" class="text-center py-8">
            <div class="text-gray-500">Loading loan history...</div>
          </div>
          <div v-else-if="loans.length === 0" class="text-center py-8">
            <div class="text-gray-500">No loan requests found</div>
          </div>
          <div v-else class="space-y-3">
            <div v-for="loan in loans" :key="loan.id" 
                 class="flex justify-between items-center p-4 rounded-lg" :class="{
                   'bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600': loan.status === 'Approved',
                   'bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600': loan.status === 'Pending',
                   'bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600': loan.status === 'Rejected',
                   'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700': !['Approved', 'Pending', 'Rejected'].includes(loan.status)
                 }">
              <div>
                <div class="font-semibold">Loan #{{ loan.id.toString().padStart(3, '0') }} - {{ formatDate(loan.created_at) }}</div>
                <div class="text-sm text-gray-600">RWF {{ parseFloat(loan.amount).toLocaleString() }} - {{ loan.repayment_period }} months</div>
              </div>
              <div class="text-right">
                <div class="font-semibold" :class="{
                  'text-green-600': loan.status === 'Approved',
                  'text-yellow-600': loan.status === 'Pending',
                  'text-red-600': loan.status === 'Rejected'
                }">{{ loan.status }}</div>
                <div class="text-xs text-gray-500">{{ loan.status === 'Approved' ? '✓ Approved' : loan.status }}</div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Loan Request Modal -->
    <UModal v-model="showLoanModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-blue-600">Request New Loan</h3>
        </template>
        
        <div class="space-y-4">
          <UFormGroup label="Loan Amount (RWF)">
            <UInput v-model="loanAmount" type="number" :max="maxLoanAmount" placeholder="Enter amount" />
            <template #help>
              <p class="text-xs text-gray-500">Maximum: RWF {{ maxLoanAmount.toLocaleString() }} (2/3 of your contributions)</p>
            </template>
          </UFormGroup>
          
          <UFormGroup label="Repayment Period">
            <UInput v-model="repaymentPeriod" value="6" readonly disabled>
              <template #trailing>
                <span class="text-gray-500">months</span>
              </template>
            </UInput>
            <template #help>
              <p class="text-xs text-gray-500">Fixed at 6 months as per loan policy</p>
            </template>
          </UFormGroup>
          
          <UFormGroup label="Purpose of Loan">
            <UTextarea v-model="loanPurpose" placeholder="Describe the purpose of this loan" />
          </UFormGroup>
          
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-sm font-semibold text-blue-700">Loan Summary</div>
            <div class="text-xs text-gray-600 mt-1">
              Monthly Payment: RWF {{ calculateMonthlyPayment() }}<br>
              Total Interest: RWF {{ calculateTotalInterest() }}<br>
              Total Repayment: RWF {{ calculateTotalRepayment() }}
            </div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showLoanModal = false" variant="outline">Cancel</UButton>
            <UButton @click="submitLoanRequest" color="blue" :loading="loanLoading">
              Submit Request
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Loan Payment Modal -->
    <UModal v-model="showPaymentModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-orange-600">Make Loan Payment</h3>
        </template>
        
        <div class="space-y-4">
          <div class="p-4 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="text-sm text-gray-600 dark:text-slate-400">Total Amount Due: RWF {{ parseFloat(activeLoan?.total_amount || 0).toLocaleString() }}</div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Amount Already Paid: RWF 0</div>
            <div class="text-lg font-bold text-gray-900 dark:text-white">Remaining Balance: RWF {{ parseFloat(activeLoan?.total_amount || 0).toLocaleString() }}</div>
          </div>
          
          <UFormGroup label="Payment Amount (RWF)">
            <UInput v-model="customPaymentAmount" type="number" :max="parseFloat(activeLoan?.total_amount || 0)" placeholder="Enter amount to pay" />
            <template #help>
              <p class="text-xs text-gray-500">Maximum: RWF {{ parseFloat(activeLoan?.total_amount || 0).toLocaleString() }}</p>
            </template>
          </UFormGroup>
          
          <UFormGroup label="Payment Method">
            <USelect v-model="paymentMethod" :options="paymentOptions" />
          </UFormGroup>
          
          <UFormGroup label="Phone Number" v-if="paymentMethod === 'mobile_money'">
            <UInput v-model="loanPaymentPhone" placeholder="0781234567" />
          </UFormGroup>
        </div>
        
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showPaymentModal = false" variant="outline">Cancel</UButton>
            <UButton @click="processLoanPayment" color="orange" :loading="paymentLoading" :disabled="!customPaymentAmount || customPaymentAmount <= 0 || parseFloat(customPaymentAmount) > parseFloat(activeLoan?.total_amount || 0) || (paymentMethod === 'mobile_money' && !loanPaymentPhone)">
              Pay RWF {{ parseFloat(customPaymentAmount || 0).toLocaleString() }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Error Modal -->
    <UModal v-model="showErrorModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <Icon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-red-600">Loan Request Failed</h3>
          </div>
        </template>

        <div class="py-4">
          <p class="text-gray-700">{{ errorMessage }}</p>
        </div>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showErrorModal = false" variant="outline">
              Try Again
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Success Modal -->
    <UModal v-model="showSuccessModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Icon name="i-heroicons-check-circle" class="w-5 h-5 text-green-600" />
            </div>
            <h3 class="text-lg font-semibold text-green-600">Loan Request Successful</h3>
          </div>
        </template>

        <div class="py-4">
          <p class="text-gray-700">{{ successMessage }}</p>
        </div>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showSuccessModal = false" color="green">
              Continue
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
const showLoanModal = ref(false)
const showPaymentModal = ref(false)
const loanLoading = ref(false)
const paymentLoading = ref(false)
const loading = ref(true)
const loadingTontines = ref(true)
const loans = ref([])
const user = ref(null)
const selectedTontine = ref(null)
const userTontines = ref([])
const contributionsByTontine = ref({})
const hasActiveLoan = ref(false)
const activeLoan = ref(null)
const maxLoanAmount = ref(0)
const userContributions = ref(0)
const errorMessage = ref('')
const successMessage = ref('')
const showErrorModal = ref(false)
const showSuccessModal = ref(false)

const loanAmount = ref('')
const repaymentPeriod = ref(6)
const loanPurpose = ref('')
const paymentMethod = ref('mobile_money')
const customPaymentAmount = ref('')
const loanPaymentPhone = ref('')

const repaymentOptions = [
  { label: '3 Months', value: 3 },
  { label: '4 Months', value: 4 },
  { label: '5 Months', value: 5 },
  { label: '6 Months', value: 6 }
]

const paymentOptions = [
  { label: 'Mobile Money', value: 'mobile_money' },
  { label: 'Bank Transfer', value: 'bank' },
  { label: 'Cash', value: 'cash' }
]

// Get user data and fetch loans
onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
      loanPaymentPhone.value = user.value.phone // Pre-fill with user's phone
      await fetchUserTontines()
      
      // Auto-select tontine from URL parameter
      const route = useRoute()
      if (route.query.tontine) {
        const tontine = userTontines.value.find(t => t.id == route.query.tontine)
        if (tontine) {
          selectTontine(tontine)
        } else {
          loading.value = false
        }
      } else {
        loading.value = false
      }
    }
  }
})

const fetchUserTontines = async () => {
  try {
    loadingTontines.value = true
    const response = await fetch(`http://localhost:8000/api/tontines/user/${user.value.id}`)
    userTontines.value = await response.json()
    
    // Fetch contributions for all tontines
    const contributionsResponse = await fetch(`http://localhost:8000/api/contributions/user/${user.value.id}`)
    const contributions = await contributionsResponse.json()
    
    // Group contributions by tontine
    contributionsByTontine.value = contributions.reduce((acc, contrib) => {
      if (!acc[contrib.tontine_id]) {
        acc[contrib.tontine_id] = []
      }
      acc[contrib.tontine_id].push(contrib)
      return acc
    }, {})
  } catch (error) {
    console.error('Failed to fetch user tontines:', error)
  } finally {
    loadingTontines.value = false
  }
}

const selectTontine = async (tontine) => {
  selectedTontine.value = tontine
  const tontineContributions = getTontineContributions(tontine.id)
  maxLoanAmount.value = Math.floor((tontineContributions * 2) / 3)
  userContributions.value = tontineContributions
  await fetchLoans()
}

const getTontineContributions = (tontineId) => {
  const tontineContribs = contributionsByTontine.value[tontineId] || []
  return tontineContribs
    .filter(c => c.payment_status === 'Approved')
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
}

const fetchLoans = async () => {
  if (!selectedTontine.value) {
    loading.value = false
    return
  }
  
  try {
    loading.value = true
    
    // Fetch user loan requests
    const response = await fetch(`http://localhost:8000/api/loans/requests/user/${user.value.id}`)
    const data = await response.json()
    console.log('All user loans:', data)
    console.log('Selected tontine ID:', selectedTontine.value.id)
    loans.value = data.filter(l => l.tontine_id == selectedTontine.value.id)
    console.log('Filtered loans:', loans.value)
    
    // Find active loan and calculate payments
    activeLoan.value = loans.value.find(loan => loan.status === 'Approved' || loan.status === 'approved')
    if (activeLoan.value) {
      // Fetch loan payments for balance calculation
      const paymentsResponse = await fetch(`http://localhost:8000/api/payments/history/${user.value.id}`)
      const paymentsData = await paymentsResponse.json()
      const loanPayments = paymentsData.loanPayments || []
      
      // Calculate total paid for this loan
      const totalPaid = loanPayments
        .filter(p => p.loan_id === activeLoan.value.id && p.payment_status === 'Approved')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
      
      activeLoan.value.total_paid = totalPaid
    }
    hasActiveLoan.value = !!activeLoan.value
    
  } catch (error) {
    console.error('Failed to fetch loans:', error)
    loans.value = []
  } finally {
    loading.value = false
  }
}

const calculateMonthlyPayment = () => {
  if (!loanAmount.value || !repaymentPeriod.value) return 0
  const principal = parseFloat(loanAmount.value)
  const monthlyInterest = principal * 0.017
  const monthlyPrincipal = principal / repaymentPeriod.value
  return Math.round(monthlyPrincipal + monthlyInterest).toLocaleString()
}

const calculateTotalInterest = () => {
  if (!loanAmount.value || !repaymentPeriod.value) return 0
  const principal = parseFloat(loanAmount.value)
  const totalInterest = principal * 0.017 * repaymentPeriod.value
  return Math.round(totalInterest).toLocaleString()
}

const calculateTotalRepayment = () => {
  if (!loanAmount.value || !repaymentPeriod.value) return 0
  const principal = parseFloat(loanAmount.value)
  const totalInterest = principal * 0.017 * repaymentPeriod.value
  return Math.round(principal + totalInterest).toLocaleString()
}

const submitLoanRequest = async () => {
  loanLoading.value = true
  
  try {
    const response = await fetch('http://localhost:8000/api/loans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user.value.id,
        tontine_id: selectedTontine.value.id,
        amount: parseFloat(loanAmount.value),
        interest_rate: 1.7,
        repayment_period: repaymentPeriod.value,
        phone_number: user.value.phone,
        purpose: loanPurpose.value
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      successMessage.value = data.message || 'Loan request submitted successfully'
      showSuccessModal.value = true
      showLoanModal.value = false
      await fetchLoans()
      
      // Trigger auto-refresh
      localStorage.setItem('auto-refresh-trigger', Date.now().toString())
      window.dispatchEvent(new CustomEvent('auto-refresh'))
    } else {
      errorMessage.value = data.message || 'Failed to submit loan request'
      showErrorModal.value = true
    }
    
  } catch (error) {
    errorMessage.value = 'Failed to submit loan request. Please try again.'
    showErrorModal.value = true
  } finally {
    loanLoading.value = false
  }
}

const processLoanPayment = async () => {
  paymentLoading.value = true
  
  try {
    const paymentAmount = parseFloat(customPaymentAmount.value)
    
    const response = await fetch('http://localhost:8000/api/payments/loan-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        loanId: activeLoan.value.id,
        userId: user.value.id,
        paymentAmount: paymentAmount,
        paymentMethod: paymentMethod.value,
        paymentData: {
          phone: loanPaymentPhone.value,
          description: `Loan payment for loan #${activeLoan.value.id}`
        }
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      successMessage.value = data.message || 'Loan payment submitted successfully'
      showSuccessModal.value = true
      showPaymentModal.value = false
      customPaymentAmount.value = ''
      await fetchLoans()
      
      // Trigger auto-refresh
      localStorage.setItem('auto-refresh-trigger', Date.now().toString())
      window.dispatchEvent(new CustomEvent('auto-refresh'))
    } else {
      errorMessage.value = data.message || 'Payment failed'
      showErrorModal.value = true
    }
    
  } catch (error) {
    errorMessage.value = 'Payment failed. Please try again.'
    showErrorModal.value = true
  } finally {
    paymentLoading.value = false
  }
}

const calculateRemainingBalance = (loan) => {
  if (!loan) return 0
  
  // Get total amount due (principal + interest)
  const principal = parseFloat(loan.amount || 0)
  const interestRate = parseFloat(loan.interest_rate || 1.7) / 100
  const repaymentPeriod = loan.repayment_period || 6
  const totalInterest = principal * interestRate * repaymentPeriod
  const totalAmountDue = principal + totalInterest
  
  // Subtract actual approved payments
  const totalPaid = loan.total_paid || 0
  const remainingBalance = totalAmountDue - parseFloat(totalPaid)
  
  return Math.max(0, Math.round(remainingBalance))
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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

const getStatusClass = (status) => {
  return 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700'
}

const getStatusTextClass = (status) => {
  switch (status) {
    case 'completed': return 'text-green-600'
    case 'active': case 'approved': return 'text-orange-600'
    case 'pending': return 'text-yellow-600'
    case 'rejected': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed': return '✓'
    case 'active': case 'approved': return '⏳'
    case 'pending': return '⏰'
    case 'rejected': return '✗'
    default: return '•'
  }
}

definePageMeta({
  layout: 'default'
})
</script>