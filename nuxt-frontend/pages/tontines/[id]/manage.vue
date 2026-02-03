<template>
  <div class="space-y-4 sm:space-y-6 p-4 sm:p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ tontineName }} Management</h1>
        <p class="text-gray-600 dark:text-slate-400">Manage members, contributions, loans, and payments</p>
      </div>
      <button v-if="activeTab === 'members'" @click="showAddModal = true" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-full sm:w-auto">
        <Icon name="i-heroicons-plus" class="w-4 h-4" />
        Add Member
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="mb-6">
      <nav class="flex space-x-8 border-b border-gray-200 dark:border-slate-700">
        <button 
          @click="activeTab = 'members'"
          :class="activeTab === 'members' ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Members
        </button>
      </nav>
    </div>

    <!-- Members Tab -->
    <div v-if="activeTab === 'members'">
      <UCard class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tontine Members ({{ filteredMembers.length }}/20)</h3>
        </div>
      </template>

      <div v-if="loading" class="text-center py-8">
        <div class="text-gray-500 dark:text-slate-400">Loading members...</div>
      </div>

      <div v-else-if="paginatedMembers.length === 0" class="text-center py-8">
        <div class="text-gray-500 dark:text-slate-400">No members found</div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead class="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Name</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Email</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Phone</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Role</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-for="member in paginatedMembers" :key="member.id" class="hover:bg-gray-50 dark:hover:bg-slate-700">
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {{ member.names }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                {{ member.email }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                {{ member.phone }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span :class="member.role === 'admin' || member.role === 'president' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ member.role }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span :class="member.email_verified ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ member.email_verified ? 'Verified' : 'Pending' }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button @click="editMember(member)" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs">
                  Edit
                </button>
                <button @click="removeMember(member.id)" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </UCard>
    </div>

    <!-- Add Member Modal -->
    <UModal v-model="showAddModal">
      <UCard class="bg-white dark:bg-slate-800">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Add New Member</h3>
        </template>

        <UForm :state="newMember" @submit="addMember" class="space-y-4">
          <UFormGroup label="Full Names" name="names" required>
            <UInput v-model="newMember.names" placeholder="Enter full names" />
          </UFormGroup>

          <UFormGroup label="Email" name="email" required>
            <UInput v-model="newMember.email" type="email" placeholder="Enter email" />
          </UFormGroup>

          <UFormGroup label="Phone" name="phone" required>
            <UInput v-model="newMember.phone" placeholder="078XXXXXXX" />
          </UFormGroup>

          <UFormGroup label="Password" name="password" required>
            <UInput v-model="newMember.password" type="password" placeholder="Enter password" />
          </UFormGroup>

          <UFormGroup label="Role" name="role">
            <USelect v-model="newMember.role" :options="roleOptions" />
          </UFormGroup>

          <div class="flex gap-2 justify-end">
            <UButton @click="showAddModal = false" variant="outline">Cancel</UButton>
            <UButton type="submit" :loading="submitting" class="bg-green-600 hover:bg-green-700 text-white">Add Member</UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin',
  layout: 'default'
})

const route = useRoute()
const toast = useToast()

const tontineId = route.params.id
const tontineName = ref('')
const activeTab = ref('members')
const members = ref([])
const loading = ref(true)
const submitting = ref(false)
const showAddModal = ref(false)

const currentPage = ref(1)
const itemsPerPage = 6

const newMember = ref({
  names: '',
  email: '',
  phone: '',
  password: '',
  role: 'member'
})

const roleOptions = [
  { label: 'Member', value: 'member' },
  { label: 'Admin', value: 'admin' }
]

onMounted(() => {
  fetchTontineDetails()
  fetchMembers()
})

const fetchTontineDetails = async () => {
  try {
    const response = await fetch(`http://localhost:8000/api/tontines/${tontineId}`)
    const data = await response.json()
    tontineName.value = data.name
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to fetch tontine details',
      color: 'red'
    })
  }
}

const fetchMembers = async () => {
  try {
    loading.value = true
    const response = await fetch(`http://localhost:8000/api/tontines/${tontineId}/members`)
    const data = await response.json()
    members.value = data
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to fetch members',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const filteredMembers = computed(() => members.value)
const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredMembers.value.slice(start, end)
})

const addMember = async () => {
  try {
    submitting.value = true
    
    const response = await fetch('http://localhost:8000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newMember.value)
    })
    
    const data = await response.json()
    
    if (data.success) {
      await fetch(`http://localhost:8000/api/tontines/${tontineId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: data.userId })
      })
      
      toast.add({
        title: 'Success',
        description: 'Member added successfully',
        color: 'green'
      })
      
      showAddModal.value = false
      newMember.value = { names: '', email: '', phone: '', password: '', role: 'member' }
      await fetchMembers()
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to add member',
      color: 'red'
    })
  } finally {
    submitting.value = false
  }
}

const editMember = (member) => {
  // TODO: Implement edit functionality
  toast.add({
    title: 'Info',
    description: 'Edit functionality coming soon',
    color: 'blue'
  })
}

const removeMember = async (memberId) => {
  if (!confirm('Are you sure you want to remove this member?')) return
  
  try {
    const response = await fetch(`http://localhost:8000/api/tontines/${tontineId}/members/${memberId}`, {
      method: 'DELETE'
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.add({
        title: 'Success',
        description: 'Member removed successfully',
        color: 'green'
      })
      await fetchMembers()
    }
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to remove member',
      color: 'red'
    })
  }
}
</script>