<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-6xl mx-auto p-6">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-green-600">Tontine Management</h1>
          <p class="text-gray-600">Manage The Future Association tontines</p>
        </div>
        <div class="flex gap-4">
          <UButton @click="navigateTo('/dashboard')" variant="outline" icon="i-heroicons-arrow-left">
            Back to Dashboard
          </UButton>
              <button v-if="isAdmin" @click="showCreateModal = true" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Icon name="i-heroicons-plus" class="w-4 h-4" />
                Create Tontine
              </button>
        </div>
      </div>

      <!-- Tontines List -->
      <div v-if="loading" class="text-center py-8">
        <div class="text-gray-500">Loading tontines...</div>
      </div>
      
      <div v-else class="grid gap-6">
        <UCard v-for="tontine in tontines" :key="tontine.id" class="border-0 shadow-lg">
          <div class="p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-xl font-semibold text-green-600">{{ tontine.name }}</h3>
                <p class="text-gray-600">{{ tontine.description }}</p>
              </div>
              <span :class="tontine.status === 'active' ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                {{ tontine.status }}
              </span>
            </div>
            
            <div class="grid md:grid-cols-4 gap-4 mb-4">
              <div class="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="text-lg font-bold text-green-600">RWF {{ Number(tontine.contribution_amount).toLocaleString() }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Monthly Contribution</div>
              </div>
              <div class="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="text-lg font-bold text-gray-700 dark:text-slate-300">{{ tontine.member_count || 0 }}/{{ tontine.max_members }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Members</div>
              </div>
              <div class="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="text-lg font-bold text-gray-700 dark:text-slate-300">RWF {{ Number(tontine.total_contributions || 0).toLocaleString() }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Total Contributions</div>
              </div>
              <div class="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                <div class="text-lg font-bold text-gray-700 dark:text-slate-300">{{ formatDate(tontine.start_date) }}</div>
                <div class="text-sm text-gray-600 dark:text-slate-400">Start Date</div>
              </div>
            </div>
            
            <div class="flex gap-2">
              <UButton @click="() => navigateTo(`/tontine-details?id=${tontine.id}`)" size="sm" variant="outline">
                View Details
              </UButton>
              <button v-if="!isMember(tontine.id) && tontine.member_count < tontine.max_members" @click="showJoinModal(tontine)" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                Join Tontine
              </button>
              <UButton v-else-if="!isMember(tontine.id)" size="sm" color="gray" disabled>
                Tontine Full
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Create Tontine Modal -->
    <UModal v-model="showCreateModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-green-600">Create New Tontine</h3>
        </template>
        
        <div class="space-y-4">
          <UFormGroup label="Tontine Name" required>
            <UInput v-model="newTontine.name" placeholder="Enter tontine name" />
          </UFormGroup>
          
          <UFormGroup label="Description">
            <UTextarea v-model="newTontine.description" placeholder="Describe the tontine purpose" />
          </UFormGroup>
          
          <UFormGroup label="Monthly Contribution Amount (RWF)" required>
            <UInput v-model="newTontine.contribution_amount" type="number" placeholder="20000" />
          </UFormGroup>
          
          <UFormGroup label="Maximum Members" required>
            <UInput v-model="newTontine.max_members" type="number" placeholder="20" max="20" />
          </UFormGroup>
          
          <UFormGroup label="Start Date">
            <UInput v-model="newTontine.start_date" type="date" :min="today" />
          </UFormGroup>
          
          <UFormGroup label="End Date (Optional)">
            <UInput v-model="newTontine.end_date" type="date" :min="newTontine.start_date || today" />
          </UFormGroup>
        </div>
        
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showCreateModal = false" variant="outline">Cancel</UButton>
            <UButton @click="createTontine" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg" :loading="createLoading">
              Create Tontine
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Join Confirmation Modal -->
    <UModal v-model="showJoinConfirm">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-green-600">Join Tontine</h3>
        </template>
        
        <div class="space-y-4">
          <div class="text-center">
            <div class="text-4xl mb-4">🌱</div>
            <h4 class="text-lg font-medium text-gray-900">{{ selectedTontine?.name }}</h4>
            <p class="text-gray-600 mt-2">Are you sure you want to join this tontine?</p>
          </div>
          
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-green-800">Monthly Contribution:</span>
                <div class="text-green-600">RWF {{ Number(selectedTontine?.contribution_amount || 0).toLocaleString() }}</div>
              </div>
              <div>
                <span class="font-medium text-green-800">Members:</span>
                <div class="text-green-600">{{ selectedTontine?.member_count || 0 }}/{{ selectedTontine?.max_members }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showJoinConfirm = false" variant="outline">Cancel</UButton>
            <UButton @click="confirmJoin" color="green" :loading="joinLoading">
              Yes, Join Tontine
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
const showCreateModal = ref(false)
const createLoading = ref(false)
const loading = ref(true)
const tontines = ref([])
const user = ref(null)
const userTontines = ref([])
const showJoinConfirm = ref(false)
const selectedTontine = ref(null)
const joinLoading = ref(false)

const today = new Date().toISOString().split('T')[0]

const newTontine = ref({
  name: '',
  description: '',
  contribution_amount: 20000,
  max_members: 20,
  start_date: '',
  end_date: ''
})

const isAdmin = computed(() => {
  return user.value?.role === 'admin' || user.value?.role === 'president'
})

onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
      await fetchTontines()
      await fetchUserTontines()
    }
  }
})

const fetchTontines = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/tontines')
    const data = await response.json()
    tontines.value = data
  } catch (error) {
    console.error('Failed to fetch tontines:', error)
  } finally {
    loading.value = false
  }
}

const fetchUserTontines = async () => {
  try {
    const response = await fetch(`http://localhost:8000/api/tontines/user/${user.value.id}`)
    const data = await response.json()
    userTontines.value = data
  } catch (error) {
    console.error('Failed to fetch user tontines:', error)
  }
}

const isMember = (tontineId) => {
  return userTontines.value.some(t => t.id === tontineId)
}

const createTontine = async () => {
  createLoading.value = true
  
  try {
    const response = await fetch('http://localhost:8000/api/tontines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...newTontine.value,
        creator_id: user.value.id
      })
    })
    
    const data = await response.json()
    
    const toast = useToast()
    toast.add({
      title: '✅ Tontine Created!',
      description: 'New tontine has been created successfully',
      color: 'green'
    })
    
    showCreateModal.value = false
    await fetchTontines()
    
    // Reset form
    newTontine.value = {
      name: '',
      description: '',
      contribution_amount: 20000,
      max_members: 20,
      start_date: '',
      end_date: ''
    }
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: '❌ Creation Failed',
      description: error.data?.message || 'Failed to create tontine',
      color: 'red'
    })
  } finally {
    createLoading.value = false
  }
}

const showJoinModal = (tontine) => {
  selectedTontine.value = tontine
  showJoinConfirm.value = true
}

const confirmJoin = async () => {
  joinLoading.value = true
  
  try {
    const response = await fetch(`http://localhost:8000/api/tontines/${selectedTontine.value.id}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: user.value.id
      })
    })
    
    const toast = useToast()
    toast.add({
      title: '✅ Join Request Sent!',
      description: 'Your request to join the tontine has been submitted',
      color: 'green'
    })
    
    showJoinConfirm.value = false
    await fetchUserTontines()
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: '❌ Join Failed',
      description: error.data?.message || 'Failed to join tontine',
      color: 'red'
    })
  } finally {
    joinLoading.value = false
  }
}

const viewTontine = (tontineId) => {
  navigateTo(`/tontines/${tontineId}`)
}

const manageTontine = (tontineId) => {
  // Navigate to tontine-specific management page
  navigateTo(`/tontines/${tontineId}/manage`)
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

definePageMeta({
  layout: 'default'
})
</script>