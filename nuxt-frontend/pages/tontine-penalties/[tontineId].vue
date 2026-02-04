<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Penalties Management</h1>
        <p v-if="tontine" class="text-gray-600 dark:text-gray-400">{{ tontine.name }}</p>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading penalties...</p>
    </div>

    <div v-else-if="penalties.length === 0" class="text-center py-8">
      <p class="text-gray-600 dark:text-gray-400">No penalties found.</p>
    </div>

    <div v-else class="space-y-4">
      <UCard v-for="penalty in penalties" :key="penalty.id" class="hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="font-semibold text-lg">{{ penalty.member_name }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ penalty.email }}</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-bold text-red-600">RWF {{ penalty.amount.toLocaleString() }}</p>
                <span class="px-2 py-1 rounded text-xs" :class="getStatusClass(penalty.status)">
                  {{ penalty.status }}
                </span>
              </div>
            </div>
            
            <p class="text-gray-700 dark:text-gray-300 mb-3">{{ penalty.reason }}</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium">Applied:</span>
                <span class="ml-2">{{ formatDate(penalty.created_at) }}</span>
              </div>
              <div v-if="penalty.paid_at">
                <span class="font-medium">Paid:</span>
                <span class="ml-2">{{ formatDate(penalty.paid_at) }}</span>
              </div>
            </div>

            <div v-if="penalty.loan_amount" class="mt-3 text-sm">
              <span class="font-medium">Related Loan:</span>
              <span class="ml-2">RWF {{ penalty.loan_amount.toLocaleString() }}</span>
            </div>
          </div>
          
          <div class="flex gap-2 ml-4">
            <UButton 
              v-if="penalty.status === 'pending'" 
              @click="markAsPaid(penalty.id)" 
              size="sm" 
              color="green"
              :loading="updating === penalty.id"
            >
              Mark as Paid
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Summary Card -->
    <UCard v-if="penalties.length > 0" class="mt-6 bg-gray-50 dark:bg-gray-800">
      <div class="text-center">
        <h3 class="font-semibold text-lg mb-4">Penalties Summary</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-2xl font-bold text-red-600">{{ totalPenalties }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Total Penalties</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-yellow-600">{{ pendingPenalties }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Pending</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-green-600">{{ paidPenalties }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Paid</p>
          </div>
        </div>
        <div class="mt-4">
          <p class="text-xl font-semibold">
            Total Amount: RWF {{ totalAmount.toLocaleString() }}
          </p>
          <p class="text-lg text-red-600">
            Outstanding: RWF {{ outstandingAmount.toLocaleString() }}
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const route = useRoute()
const tontineId = route.params.tontineId

const penalties = ref([])
const tontine = ref(null)
const loading = ref(true)
const updating = ref(null)

const fetchTontine = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:8000/api/tontines/${tontineId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      tontine.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching tontine:', error)
  }
}

const fetchPenalties = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:8000/api/penalties/tontine/${tontineId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      penalties.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching penalties:', error)
  } finally {
    loading.value = false
  }
}

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
      await fetchPenalties()
    }
  } catch (error) {
    console.error('Error updating penalty:', error)
  } finally {
    updating.value = null
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

onMounted(() => {
  fetchTontine()
  fetchPenalties()
})
</script>