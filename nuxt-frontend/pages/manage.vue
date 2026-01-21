<template>
  <div class="space-y-4 sm:space-y-6 p-4 sm:p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Admin Management</h1>
        <p class="text-gray-600">Manage members, contributions, loans, and payments</p>
      </div>
      <button v-if="activeTab === 'members'" @click="showAddModal = true" class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 w-full sm:w-auto">
        <Icon name="i-heroicons-plus" class="w-4 h-4" />
        Add Member
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="mb-6">
      <nav class="flex space-x-8 border-b border-gray-200">
        <button 
          @click="activeTab = 'members'"
          :class="activeTab === 'members' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Members
        </button>
        <button 
          @click="activeTab = 'contributions'"
          :class="activeTab === 'contributions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Contributions
        </button>
        <button 
          @click="activeTab = 'loans'"
          :class="activeTab === 'loans' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Loans
        </button>
        <button 
          @click="activeTab = 'payments'"
          :class="activeTab === 'payments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Payments
        </button>
      </nav>
    </div>

    <!-- Members Tab -->
    <div v-if="activeTab === 'members'">
      <UCard class="glass-card">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Tontine Members ({{ filteredMembers.length }}/20)</h3>
        </div>
      </template>

      <!-- Search and Filters -->
      <div class="mb-4 flex flex-col sm:flex-row gap-4">
        <input v-model="searchQuery" placeholder="Search members..." class="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" />
        <USelect v-model="roleFilter" :options="[{label: 'All Roles', value: ''}, ...roleOptions]" class="w-full sm:w-32" />
        <USelect v-model="statusFilter" :options="[{label: 'All Status', value: ''}, {label: 'Verified', value: 'verified'}, {label: 'Pending', value: 'pending'}]" class="w-full sm:w-32" />
      </div>

      <div v-if="loading" class="text-center py-8">
        <div class="text-gray-500">Loading members...</div>
      </div>

      <div v-else-if="paginatedMembers.length === 0" class="text-center py-8">
        <div class="text-gray-500">No members found</div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shares</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="member in paginatedMembers" :key="member.id" class="hover:bg-gray-50">
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ member.names }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ member.email }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ member.phone }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span :class="member.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ member.role }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ member.shares || 1 }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span :class="member.email_verified ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ member.email_verified ? 'Verified' : 'Pending' }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <UButton @click="editMember(member)" color="blue" variant="ghost" size="xs">
                  Edit
                </UButton>
                <UButton @click="showDeleteModal(member)" color="red" variant="ghost" size="xs">
                  Remove
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="mt-4 flex justify-between items-center">
        <div class="text-sm text-gray-500">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredMembers.length) }} of {{ filteredMembers.length }} members
        </div>
        <UPagination v-if="totalPages > 1" v-model="currentPage" :page-count="totalPages" :total="filteredMembers.length" />
      </div>
      </UCard>
    </div>

    <!-- Contributions Tab -->
    <div v-if="activeTab === 'contributions'">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Contributions Management</h3>
        </template>

        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-500">Loading contributions...</div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="contribution in contributions" :key="contribution.id">
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ contribution.member_name }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatCurrency(contribution.amount) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(contribution.contribution_date) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <UBadge :color="contribution.payment_status === 'Completed' ? 'green' : contribution.payment_status === 'Pending' ? 'yellow' : 'red'" size="xs">
                    {{ contribution.payment_status }}
                  </UBadge>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <UButton v-if="contribution.payment_status === 'Pending'" @click="approveContribution(contribution.id)" color="green" variant="ghost" size="xs">
                    Approve
                  </UButton>
                  <UButton v-if="contribution.payment_status === 'Pending'" @click="rejectContribution(contribution.id)" color="red" variant="ghost" size="xs">
                    Reject
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Loans Tab -->
    <div v-if="activeTab === 'loans'">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Loans Management</h3>
        </template>

        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-500">Loading loans...</div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="loan in loans" :key="loan.id">
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ loan.member_name }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatCurrency(loan.amount) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ loan.interest_rate }}%
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(loan.due_date) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <UBadge :color="loan.status === 'approved' ? 'green' : loan.status === 'pending' ? 'yellow' : loan.status === 'paid' ? 'blue' : 'red'" size="xs">
                    {{ loan.status }}
                  </UBadge>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <UButton v-if="loan.status === 'pending'" @click="approveLoan(loan.id)" color="green" variant="ghost" size="xs">
                    Approve
                  </UButton>
                  <UButton v-if="loan.status === 'pending'" @click="rejectLoan(loan.id)" color="red" variant="ghost" size="xs">
                    Reject
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Payments Tab -->
    <div v-if="activeTab === 'payments'">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Payments History</h3>
        </template>

        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-500">Loading payments...</div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="payment in payments" :key="payment.id">
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ payment.member_name }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ payment.payment_type }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatCurrency(payment.amount) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ payment.payment_method }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(payment.created_at) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <UBadge :color="payment.status === 'completed' ? 'green' : payment.status === 'pending' ? 'yellow' : 'red'" size="xs">
                    {{ payment.status }}
                  </UBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Add Member Modal -->
    <UModal v-model="showAddModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Add New Member</h3>
        </template>

        <UForm :state="newMember" @submit="addMember" class="space-y-4">
          <!-- Error Alert -->
          <div v-if="addError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-700 text-sm">{{ addError }}</p>
          </div>
          
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
            <UButton type="submit" :loading="submitting" color="primary">Add Member</UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>

    <!-- Edit Member Modal -->
    <UModal v-model="showEditModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Edit Member</h3>
        </template>

        <UForm :state="editingMember" @submit="updateMember" class="space-y-4">
          <!-- Error Alert -->
          <div v-if="editError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-700 text-sm">{{ editError }}</p>
          </div>
          
          <UFormGroup label="Full Names" name="names" required>
            <UInput v-model="editingMember.names" placeholder="Enter full names" />
          </UFormGroup>

          <UFormGroup label="Email" name="email" required>
            <UInput v-model="editingMember.email" type="email" placeholder="Enter email" />
          </UFormGroup>

          <UFormGroup label="Phone" name="phone" required>
            <UInput v-model="editingMember.phone" placeholder="078XXXXXXX" />
          </UFormGroup>

          <UFormGroup label="Role" name="role">
            <USelect v-model="editingMember.role" :options="roleOptions" />
          </UFormGroup>

          <UFormGroup label="Shares" name="shares">
            <USelect v-model="editingMember.shares" :options="sharesOptions" />
          </UFormGroup>

          <div class="flex gap-2 justify-end">
            <UButton @click="showEditModal = false" variant="outline">Cancel</UButton>
            <UButton type="submit" :loading="submitting" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Update Member</UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteConfirm">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Remove Member</h3>
        </template>
        
        <div class="space-y-4">
          <!-- Error Alert -->
          <div v-if="deleteError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-700 text-sm">{{ deleteError }}</p>
          </div>
          
          <div class="text-center">
            <div class="text-4xl mb-4">⚠️</div>
            <h4 class="text-lg font-medium text-gray-900">{{ memberToDelete?.names }}</h4>
            <p class="text-gray-600 mt-2">Are you sure you want to remove this member from the tontine?</p>
          </div>
          
          <div class="bg-red-50 p-4 rounded-lg">
            <p class="text-red-800 text-sm font-medium">This action cannot be undone.</p>
            <p class="text-red-600 text-sm mt-1">The member will lose access to all tontine features and data.</p>
          </div>
        </div>
        
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton @click="showDeleteConfirm = false; deleteError = ''" variant="outline">Cancel</UButton>
            <UButton @click="confirmDelete" color="red" :loading="deleteLoading">
              Yes, Remove Member
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin',
  layout: 'default'
})

const { api } = useApi()
const toast = useToast()
const route = useRoute()
const tontineId = ref(route.query.tontine || '1')

const activeTab = ref('members')
const members = ref([])
const contributions = ref([])
const loans = ref([])
const payments = ref([])
const loading = ref(true)
const submitting = ref(false)
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const memberToDelete = ref(null)
const deleteLoading = ref(false)
const deleteError = ref('')
const addError = ref('')
const editError = ref('')

// Pagination and filters
const currentPage = ref(1)
const itemsPerPage = 6
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')

const newMember = ref({
  names: '',
  email: '',
  phone: '',
  password: '',
  role: 'member'
})

const editingMember = ref({
  id: null,
  names: '',
  email: '',
  phone: '',
  role: 'member',
  shares: 1
})

const roleOptions = [
  { label: 'Member', value: 'member' },
  { label: 'Admin', value: 'admin' }
]

const sharesOptions = [
  { label: '1 Share', value: 1 },
  { label: '2 Shares', value: 2 },
  { label: '3 Shares', value: 3 },
  { label: '4 Shares', value: 4 },
  { label: '5 Shares', value: 5 },
  { label: '6 Shares', value: 6 },
  { label: '7 Shares', value: 7 },
  { label: '8 Shares', value: 8 },
  { label: '9 Shares', value: 9 },
  { label: '10 Shares', value: 10 }
]

onMounted(() => {
  fetchMembers()
})

watch(activeTab, (newTab) => {
  if (newTab === 'contributions') fetchContributions()
  else if (newTab === 'loans') fetchLoans()
  else if (newTab === 'payments') fetchPayments()
})

const fetchMembers = async () => {
  try {
    loading.value = true
    const response = await api(`/tontines/${tontineId.value}/members`)
    members.value = response
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

// Computed properties for filtering and pagination
const filteredMembers = computed(() => {
  let filtered = members.value
  
  if (searchQuery.value) {
    filtered = filtered.filter(member => 
      member.names.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      member.phone.includes(searchQuery.value)
    )
  }
  
  if (roleFilter.value) {
    filtered = filtered.filter(member => member.role === roleFilter.value)
  }
  
  if (statusFilter.value) {
    if (statusFilter.value === 'verified') {
      filtered = filtered.filter(member => member.email_verified === 1 || member.email_verified === true)
    } else if (statusFilter.value === 'pending') {
      filtered = filtered.filter(member => member.email_verified === 0 || member.email_verified === false)
    }
  }
  
  return filtered
})

const totalPages = computed(() => Math.ceil(filteredMembers.value.length / itemsPerPage))

const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredMembers.value.slice(start, end)
})

// Reset pagination when filters change
watch([searchQuery, roleFilter, statusFilter], () => {
  currentPage.value = 1
})

const addMember = async () => {
  addError.value = ''
  
  try {
    submitting.value = true
    
    const response = await api('/auth/register', {
      method: 'POST',
      body: newMember.value
    })
    
    if (response.success) {
      toast.add({
        title: 'Success',
        description: response.message,
        color: 'green'
      })
      
      showAddModal.value = false
      newMember.value = { names: '', email: '', phone: '', password: '', role: 'member' }
      await fetchMembers()
    } else {
      addError.value = response.message || 'Failed to add member'
    }
    
  } catch (error) {
    addError.value = error.data?.message || 'Failed to add member'
  } finally {
    submitting.value = false
  }
}

const editMember = (member) => {
  editingMember.value = {
    id: member.id,
    names: member.names,
    email: member.email,
    phone: member.phone,
    role: member.role,
    shares: member.shares || 1
  }
  showEditModal.value = true
}

const updateMember = async () => {
  editError.value = ''
  
  try {
    submitting.value = true
    
    // Update user info
    const userResponse = await api(`/auth/manage/users/${editingMember.value.id}`, {
      method: 'PUT',
      body: {
        names: editingMember.value.names,
        email: editingMember.value.email,
        phone: editingMember.value.phone,
        role: editingMember.value.role
      }
    })
    
    // Update shares in tontine_members
    const sharesResponse = await api(`/tontines/${tontineId.value}/members/${editingMember.value.id}/shares`, {
      method: 'PUT',
      body: {
        shares: editingMember.value.shares
      }
    })
    
    if (userResponse.success && sharesResponse.success) {
      toast.add({
        title: 'Success',
        description: 'Member updated successfully',
        color: 'green'
      })
      
      showEditModal.value = false
      await fetchMembers()
    } else {
      editError.value = userResponse.message || sharesResponse.message || 'Failed to update member'
    }
    
  } catch (error) {
    editError.value = error.data?.message || 'Failed to update member'
  } finally {
    submitting.value = false
  }
}

const showDeleteModal = (member) => {
  memberToDelete.value = member
  deleteError.value = ''
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  deleteLoading.value = true
  deleteError.value = ''
  
  try {
    const response = await fetch(`http://localhost:8000/api/auth/manage/users/${memberToDelete.value.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.add({
        title: 'Member Removed',
        description: data.message,
        color: 'green'
      })
      
      showDeleteConfirm.value = false
      await fetchMembers()
    } else {
      deleteError.value = data.message || 'Member has related records and cannot be removed'
    }
    
  } catch (error) {
    deleteError.value = 'Failed to remove member'
  } finally {
    deleteLoading.value = false
  }
}

const fetchContributions = async () => {
  try {
    const response = await api(`/contributions/tontine/${tontineId.value}`)
    contributions.value = response
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to fetch contributions', color: 'red' })
  }
}

const fetchLoans = async () => {
  try {
    const response = await api(`/loans/tontine/${tontineId.value}`)
    loans.value = response
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to fetch loans', color: 'red' })
  }
}

const fetchPayments = async () => {
  try {
    const response = await api('/payments/history/all')
    payments.value = response
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to fetch payments', color: 'red' })
  }
}

const approveContribution = async (id) => {
  try {
    await api(`/contributions/${id}/approve`, { method: 'PUT' })
    toast.add({ title: 'Success', description: 'Contribution approved', color: 'green' })
    fetchContributions()
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to approve contribution', color: 'red' })
  }
}

const rejectContribution = async (id) => {
  try {
    await api(`/contributions/${id}/reject`, { method: 'PUT' })
    toast.add({ title: 'Success', description: 'Contribution rejected', color: 'green' })
    fetchContributions()
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to reject contribution', color: 'red' })
  }
}

const approveLoan = async (id) => {
  try {
    await api(`/loans/${id}/approve`, { method: 'PUT' })
    toast.add({ title: 'Success', description: 'Loan approved', color: 'green' })
    fetchLoans()
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to approve loan', color: 'red' })
  }
}

const rejectLoan = async (id) => {
  try {
    await api(`/loans/${id}/reject`, { method: 'PUT' })
    toast.add({ title: 'Success', description: 'Loan rejected', color: 'green' })
    fetchLoans()
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to reject loan', color: 'red' })
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF'
  }).format(amount)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-RW')
}


</script>