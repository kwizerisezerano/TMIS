<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">My Penalties</h1>
    </div>

    <!-- Tontine Selection -->
    <div v-if="!selectedTontine" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard v-for="tontine in userTontines" :key="tontine.id" class="hover:shadow-lg transition-shadow cursor-pointer" @click="selectTontine(tontine)">
        <div class="text-center p-4">
          <div class="text-4xl mb-4">🏦</div>
          <h3 class="text-lg font-semibold mb-2">{{ tontine.name }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">{{ tontine.description }}</p>
          <div class="text-sm">
            <p><span class="font-medium">Members:</span> {{ tontine.member_count }}/{{ tontine.max_members }}</p>
            <p><span class="font-medium">Contribution:</span> RWF {{ tontine.contribution_amount?.toLocaleString() }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Selected Tontine Penalties -->
    <div v-else>
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-semibold">{{ selectedTontine.name }} - Penalties</h2>
          <p class="text-gray-600 dark:text-gray-400">{{ selectedTontine.description }}</p>
        </div>
        <UButton @click="selectedTontine = null" variant="outline">
          Back to Tontines
        </UButton>
      </div>

      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Loading penalties...</p>
      </div>

      <div v-else-if="penalties.length === 0" class="text-center py-8">
        <p class="text-gray-600 dark:text-gray-400">No penalties found for this tontine.</p>
      </div>

      <div v-else>
        <div class="overflow-x-auto mb-6">
          <table class="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="penalty in penalties" :key="penalty.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4">
                  <div class="font-medium text-red-600 dark:text-red-400">RWF {{ penalty.amount.toLocaleString() }}</div>
                  <div v-if="penalty.loan_amount" class="text-xs text-gray-500 dark:text-gray-400">Loan: RWF {{ penalty.loan_amount.toLocaleString() }}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {{ penalty.reason }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div>{{ formatDate(penalty.created_at) }}</div>
                  <div v-if="penalty.paid_at" class="text-xs text-green-600 dark:text-green-400">Paid: {{ formatDate(penalty.paid_at) }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded text-xs" :class="getStatusClass(penalty.status)">
                      {{ penalty.status }}
                    </span>
                    <UButton 
                      v-if="penalty.status === 'pending'" 
                      @click="initiatePayment(penalty)" 
                      size="xs" 
                      color="green"
                      :loading="updating === penalty.id"
                    >
                      Pay Now
                    </UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Compact Summary -->
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p class="text-lg font-bold text-red-600">{{ totalPenalties }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Total</p>
            </div>
            <div>
              <p class="text-lg font-bold text-yellow-600">{{ pendingPenalties }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Pending</p>
            </div>
            <div>
              <p class="text-lg font-bold text-green-600">{{ paidPenalties }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Paid</p>
            </div>
            <div>
              <p class="text-lg font-bold text-red-600">RWF {{ outstandingAmount.toLocaleString() }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Outstanding</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <UModal v-model="showPaymentModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Pay Penalty</h3>
        </template>
        
        <div v-if="selectedPenalty" class="space-y-4">
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <p class="font-medium">Amount: RWF {{ selectedPenalty.amount.toLocaleString() }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ selectedPenalty.reason }}</p>
          </div>
          
          <UFormGroup label="Phone Number" required>
            <UInput 
              v-model="phoneNumber" 
              placeholder="078XXXXXXX" 
              type="tel"
            />
          </UFormGroup>
        </div>
        
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showPaymentModal = false" variant="outline">
              Cancel
            </UButton>
            <UButton @click="processPayment" color="green" :loading="updating === selectedPenalty?.id">
              Pay Now
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const toast = useToast()
const penalties = ref([])
const userTontines = ref([])
const selectedTontine = ref(null)
const loading = ref(false)
const updating = ref(null)
const showPaymentModal = ref(false)
const selectedPenalty = ref(null)
const phoneNumber = ref('')

const fetchUserTontines = async () => {
  try {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user'))
    const response = await fetch(`http://localhost:8000/api/tontines/user/${user.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      userTontines.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching user tontines:', error)
  }
}

const selectTontine = (tontine) => {
  selectedTontine.value = tontine
  fetchPenalties(tontine.id)
}

const fetchPenalties = async (tontineId) => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const userId = JSON.parse(localStorage.getItem('user')).id
    const response = await fetch(`http://localhost:8000/api/penalties/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const allPenalties = await response.json()
      penalties.value = allPenalties.filter(p => p.tontine_id === tontineId)
    }
  } catch (error) {
    console.error('Error fetching penalties:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStatusClass = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'pending':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

const totalPenalties = computed(() => penalties.value.length)
const pendingPenalties = computed(() => penalties.value.filter(p => p.status === 'pending').length)
const paidPenalties = computed(() => penalties.value.filter(p => p.status === 'paid').length)
const totalAmount = computed(() => penalties.value.reduce((sum, p) => sum + parseFloat(p.amount), 0))
const outstandingAmount = computed(() => 
  penalties.value.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount), 0)
)

const markAsPaid = async (penaltyId) => {
  updating.value = penaltyId
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:8000/api/penalties/${penaltyId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'paid' })
    })
    
    if (response.ok) {
      await fetchPenalties(selectedTontine.value.id)
    }
  } catch (error) {
    console.error('Error updating penalty:', error)
  } finally {
    updating.value = null
  }
}

const initiatePayment = (penalty) => {
  selectedPenalty.value = penalty
  phoneNumber.value = ''
  showPaymentModal.value = true
}

const processPayment = async () => {
  if (!phoneNumber.value) {
    toast.add({
      title: 'Error',
      description: 'Please enter phone number',
      color: 'red'
    })
    return
  }

  updating.value = selectedPenalty.value.id
  try {
    const response = await fetch('http://localhost:8000/api/payments/penalty-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        penaltyId: selectedPenalty.value.id,
        amount: selectedPenalty.value.amount,
        phoneNumber: phoneNumber.value
      })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      toast.add({
        title: 'Success',
        description: result.message,
        color: 'green'
      })
      showPaymentModal.value = false
      await fetchPenalties(selectedTontine.value.id)
    } else {
      toast.add({
        title: 'Payment Failed',
        description: result.message || 'Payment processing failed',
        color: 'red'
      })
      showPaymentModal.value = false
    }
  } catch (error) {
    console.error('Error processing payment:', error)
    toast.add({
      title: 'Payment Failed',
      description: 'Payment processing failed',
      color: 'red'
    })
    showPaymentModal.value = false
  } finally {
    updating.value = null
  }
}

onMounted(() => {
  fetchUserTontines()
})
</script>