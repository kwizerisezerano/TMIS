<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-4xl mx-auto p-6">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-blue-600">Loan Management</h1>
          <p class="text-gray-600">Request and manage loans within The Future</p>
        </div>
        <UButton @click="navigateTo('/dashboard')" variant="outline" icon="i-heroicons-arrow-left">
          Back to Dashboard
        </UButton>
      </div>

      <!-- Loan Eligibility -->
      <UCard class="mb-8 border-0 shadow-lg">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-blue-600 mb-4">Your Loan Eligibility</h2>
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
              <div class="bg-orange-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-orange-600">RWF {{ parseFloat(activeLoan.amount).toLocaleString() }}</div>
                <div class="text-sm text-gray-600">Loan Amount</div>
              </div>
            </div>
            <div>
              <div class="bg-red-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-red-600">RWF {{ parseFloat(activeLoan.remaining_balance || activeLoan.amount).toLocaleString() }}</div>
                <div class="text-sm text-gray-600">Remaining Balance</div>
              </div>
            </div>
          </div>
          
          <div class="mt-6 grid md:grid-cols-2 gap-4">
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="font-semibold">Loan Status</div>
              <div class="text-sm text-gray-600">{{ activeLoan.status }}</div>
              <div class="text-lg font-bold text-blue-600">RWF {{ calculateRemainingBalance(activeLoan).toLocaleString() }}</div>
              <div class="text-xs text-gray-500">Remaining Balance</div>
            </div>
            <div class="flex items-center">
              <UButton @click="showPaymentModal = true" color="orange" size="lg">
                Make Loan Payment
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Loan History -->
      <UCard class="border-0 shadow-lg">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-blue-600 mb-4">Loan History</h2>
          <div v-if="loading" class="text-center py-8">
            <div class="text-gray-500">Loading loan history...</div>
          </div>
          <div v-else-if="loans.length === 0" class="text-center py-8">
            <div class="text-gray-500">No loan history found</div>
          </div>
          <div v-else class="space-y-3">
            <div v-for="loan in loans" :key="loan.id" class="flex justify-between items-center p-4 rounded-lg" :class="getStatusClass(loan.status)">
              <div>
                <div class="font-semibold">Loan #{{ loan.id.toString().padStart(3, '0') }} - {{ formatDate(loan.created_at) }}</div>
                <div class="text-sm text-gray-600">RWF {{ parseFloat(loan.amount).toLocaleString() }} - {{ loan.status }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs" :class="getStatusTextClass(loan.status)">{{ getStatusIcon(loan.status) }} {{ loan.status }}</div>
                <div class="text-sm text-gray-600">{{ loan.repayment_period }} months</div>
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
            <USelect v-model="repaymentPeriod" :options="repaymentOptions" />
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
          <div class="bg-orange-50 p-4 rounded-lg">
            <div class="text-sm text-gray-600">Total Amount Due: RWF {{ parseFloat(activeLoan?.total_amount || 0).toLocaleString() }}</div>
            <div class="text-sm text-gray-600">Remaining Balance: RWF {{ calculateRemainingBalance(activeLoan).toLocaleString() }}</div>
          </div>
          
          <UFormGroup label="Payment Amount (RWF)">
            <UInput v-model="customPaymentAmount" type="number" :max="calculateRemainingBalance(activeLoan)" placeholder="Enter amount to pay" />
            <template #help>
              <p class="text-xs text-gray-500">Maximum: RWF {{ calculateRemainingBalance(activeLoan).toLocaleString() }}</p>
            </template>
          </UFormGroup>
          
          <UFormGroup label="Payment Method">
            <USelect v-model="paymentMethod" :options="paymentOptions" />
          </UFormGroup>
        </div>
        
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showPaymentModal = false" variant="outline">Cancel</UButton>
            <UButton @click="processLoanPayment" color="orange" :loading="paymentLoading" :disabled="!customPaymentAmount || customPaymentAmount <= 0">
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
const loans = ref([])
const user = ref(null)
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
      await fetchLoans()
    }
  }
})

const fetchLoans = async () => {
  try {
    const response = await fetch(`http://localhost:8000/api/loans/user/${user.value.id}`)
    const data = await response.json()
    loans.value = data
    
    // Find active loan (approved loans that aren't fully paid)
    activeLoan.value = data.find(loan => loan.status === 'Approved' || loan.status === 'approved')
    hasActiveLoan.value = !!activeLoan.value
    
    console.log('Active loan found:', activeLoan.value)
    
    // Fetch user contributions for loan eligibility calculation (only approved)
    const contributionsResponse = await fetch(`http://localhost:8000/api/contributions/user/${user.value.id}`)
    const contributionsData = await contributionsResponse.json()
    const totalContributions = contributionsData
      .filter(c => c.payment_status === 'Approved')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
    
    // Update loan eligibility based on actual contributions (2/3 rule)
    maxLoanAmount.value = Math.floor((totalContributions * 2) / 3)
    userContributions.value = totalContributions
    
  } catch (error) {
    console.error('Failed to fetch loans:', error)
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
    const response = await $fetch('http://localhost:8000/api/loans', {
      method: 'POST',
      body: {
        user_id: user.value.id,
        tontine_id: 1,
        amount: parseFloat(loanAmount.value),
        interest_rate: 1.7,
        repayment_period: repaymentPeriod.value,
        purpose: loanPurpose.value
      }
    })
    
    if (response.message) {
      successMessage.value = response.message
      showSuccessModal.value = true
      showLoanModal.value = false
      await fetchLoans()
    }
    
  } catch (error) {
    let message = 'Failed to submit loan request. Please try again.'
    
    if (error.data?.message) {
      message = error.data.message
    }
    
    errorMessage.value = message
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
        phoneNumber: user.value.phone
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      successMessage.value = data.message || 'Loan payment submitted successfully'
      showSuccessModal.value = true
      showPaymentModal.value = false
      customPaymentAmount.value = ''
      await fetchLoans()
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
  const principal = parseFloat(loan.amount || 0)
  const interestRate = parseFloat(loan.interest_rate || 1.7) / 100
  const repaymentPeriod = loan.repayment_period || 6
  const totalInterest = principal * interestRate * repaymentPeriod
  return principal + totalInterest
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const calculateNextPayment = (loan) => {
  if (!loan || !loan.amount) return 0
  const principal = parseFloat(loan.amount)
  const repaymentPeriod = loan.repayment_period || 6 // Default to 6 months
  const monthlyInterest = principal * 0.017
  const monthlyPrincipal = principal / repaymentPeriod
  const payment = Math.round(monthlyPrincipal + monthlyInterest)
  console.log('Loan payment calculation:', { principal, repaymentPeriod, monthlyInterest, monthlyPrincipal, payment })
  return payment
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