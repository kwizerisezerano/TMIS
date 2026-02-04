<template>
  <div class="min-h-screen bg-white">
    <div>
      <PageHeader 
        title="Tontines" 
        :description="isAdmin ? 'Browse and manage tontines' : 'Browse available tontines'"
      >
        <template #actions>
          <ActionButton 
            v-if="isAdmin" 
            @click="openModal('create')" 
            icon="i-heroicons-plus"
          >
            Create Tontine
          </ActionButton>
        </template>
      </PageHeader>

      <!-- Search and Filters -->
      <DataTable 
        :data="tontines"
        :columns="tableColumns"
        :loading="loading"
        search-placeholder="Search tontines..."
        loading-text="Loading tontines..."
        item-name="tontines"
        :filters="statusFilters"
      >
        <template #name="{ item }">
          <div class="text-sm font-medium text-green-600">{{ item.name }}</div>
        </template>
        
        <template #contribution_amount="{ item }">
          <div class="text-sm font-medium text-gray-900">RWF {{ Number(item.contribution_amount).toLocaleString() }}</div>
          <div class="text-xs text-gray-500">Monthly</div>
        </template>
        
        <template #members="{ item }">
          <div class="text-sm text-gray-900">{{ item.member_count || 0 }}/{{ item.max_members }}</div>
        </template>
        
        <template #total_contributions="{ item }">
          <div class="text-sm text-gray-900">RWF {{ Number(item.total_contributions || 0).toLocaleString() }}</div>
        </template>
        
        <template #status="{ item }">
          <StatusBadge :status="item.status" />
        </template>
        
        <template #actions="{ item }">
          <div class="space-x-2">
            <button @click="viewTontine(item.id)" class="text-green-600 hover:text-green-900">
              View
            </button>
            <button @click="viewTontineReport(item.id)" class="text-purple-600 hover:text-purple-900">
              Reports
            </button>
            <button @click="manageMeetings(item.id)" class="text-blue-600 hover:text-blue-900">
              Meetings
            </button>
            <button @click="managePenalties(item.id)" class="text-orange-600 hover:text-orange-900">
              Penalties
            </button>
            <button v-if="!isMember(item.id) && item.member_count < item.max_members && item.status === 'active'" @click="showJoinModal(item)" class="text-blue-600 hover:text-blue-900">
              Join
            </button>
            <button v-if="isAdmin && item.status === 'inactive'" @click="activateTontine(item.id)" class="text-green-600 hover:text-green-900">
              Activate
            </button>
            <button v-if="isAdmin && item.status === 'active'" @click="deactivateTontine(item.id)" class="text-yellow-600 hover:text-yellow-900">
              Deactivate
            </button>
            <button v-if="isAdmin" @click="openModal('edit', item)" class="text-blue-600 hover:text-blue-900">
              Edit
            </button>
            <button v-if="isAdmin" @click="openModal('delete', item)" class="text-red-600 hover:text-red-900">
              Delete
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Tontine Modal (Create/Edit/Delete) -->
    <TontineModal 
      v-model="showModal" 
      :mode="modalMode" 
      :tontine="selectedTontine" 
      :loading="modalLoading"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />

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
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 6
const showCreateModal = ref(false)
const showModal = ref(false)
const modalMode = ref('create')
const modalLoading = ref(false)

const tableColumns = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'contribution_amount', label: 'Contribution' },
  { key: 'members', label: 'Members' },
  { key: 'total_contributions', label: 'Total' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' }
]

const statusFilters = [
  { label: 'All Status', value: '', filterFn: null },
  { label: 'Active', value: 'active', filterFn: (item) => item.status === 'active' },
  { label: 'Inactive', value: 'inactive', filterFn: (item) => item.status === 'inactive' }
]
const loading = ref(true)
const tontines = ref([])
const user = ref(null)
const userTontines = ref([])
const showJoinConfirm = ref(false)
const selectedTontine = ref(null)
const joinLoading = ref(false)


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

const openModal = (mode, tontine = null) => {
  modalMode.value = mode
  selectedTontine.value = tontine
  showModal.value = true
}

const handleModalConfirm = async (formData) => {
  modalLoading.value = true
  
  try {
    if (modalMode.value === 'delete') {
      await fetch(`http://localhost:8000/api/tontines/${selectedTontine.value.id}`, {
        method: 'DELETE'
      })
      
      const toast = useToast()
      toast.add({
        title: '✅ Tontine Deleted!',
        description: 'Tontine has been deleted successfully',
        color: 'green'
      })
      
      // Wait for user to see the message before closing modal
      setTimeout(() => {
        showModal.value = false
      }, 1500)
    } else {
      const isEdit = modalMode.value === 'edit'
      const url = isEdit ? `http://localhost:8000/api/tontines/${selectedTontine.value.id}` : 'http://localhost:8000/api/tontines'
      const method = isEdit ? 'PUT' : 'POST'
      
      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          creator_id: user.value.id
        })
      })
      
      const toast = useToast()
      toast.add({
        title: isEdit ? '✅ Tontine Updated!' : '✅ Tontine Created!',
        description: isEdit ? 'Tontine has been updated successfully' : 'New tontine has been created successfully',
        color: 'green'
      })
      
      showModal.value = false
    }
    await fetchTontines()
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: '❌ Operation Failed',
      description: 'Failed to complete operation',
      color: 'red'
    })
  } finally {
    modalLoading.value = false
  }
}

const handleModalCancel = () => {
  showModal.value = false
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
  const router = useRouter()
  router.push(`/tontine-details?id=${tontineId}`)
}

const viewTontineReport = (tontineId) => {
  const router = useRouter()
  router.push(`/reports?tontine=${tontineId}`)
}

const manageMeetings = (tontineId) => {
  const router = useRouter()
  router.push(`/tontine-meetings/${tontineId}`)
}

const managePenalties = (tontineId) => {
  const router = useRouter()
  router.push(`/tontine-penalties/${tontineId}`)
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

const activateTontine = async (id) => {
  try {
    await fetch(`http://localhost:8000/api/tontines/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'active', userId: user.value?.id })
    })
    
    const toast = useToast()
    toast.add({
      title: '✅ Tontine Activated!',
      description: 'Tontine has been activated successfully',
      color: 'green'
    })
    
    await fetchTontines()
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: '❌ Activation Failed',
      description: 'Failed to activate tontine',
      color: 'red'
    })
  }
}

const deactivateTontine = async (id) => {
  try {
    await fetch(`http://localhost:8000/api/tontines/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'inactive', userId: user.value?.id })
    })
    
    const toast = useToast()
    toast.add({
      title: '✅ Tontine Deactivated!',
      description: 'Tontine has been deactivated successfully',
      color: 'green'
    })
    
    await fetchTontines()
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: '❌ Deactivation Failed',
      description: 'Failed to deactivate tontine',
      color: 'red'
    })
  }
}

definePageMeta({
  layout: 'default'
})
</script>