<template>
  <div class="min-h-screen bg-white dark:bg-black">
    <div class="max-w-6xl mx-auto p-6">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-green-600 dark:text-white">Tontine Details</h1>
        <div class="flex gap-2">
          <UButton @click="manageTontine(tontineId)" color="blue">
            Manage Tontine
          </UButton>
          <UButton @click="navigateTo('/tontines')" variant="outline">
            Back to Tontines
          </UButton>
        </div>
      </div>
      
      <div v-if="loading" class="text-center py-12">
        <div class="text-gray-500 dark:text-white text-lg">Loading tontine details...</div>
      </div>
      
      <div v-else-if="tontine.name" class="space-y-8">
        <!-- Tontine Header -->
        <UCard class="shadow-lg bg-white dark:bg-gray-800">
          <div class="p-8">
            <div class="flex justify-between items-start mb-6">
              <div>
                <h2 class="text-3xl font-bold text-green-600 dark:text-white mb-2">{{ tontine.name }}</h2>
                <p class="text-gray-600 dark:text-white text-lg mb-3">{{ tontine.description }}</p>
                <p class="text-sm text-gray-500 dark:text-white">Created by: {{ tontine.creator_name }} • {{ formatDate(tontine.created_at) }}</p>
              </div>
              <span :class="tontine.status === 'active' ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium">
                {{ tontine.status?.toUpperCase() }}
              </span>
            </div>
            
            <div class="grid md:grid-cols-4 gap-6">
              <div class="bg-green-50 dark:bg-green-900 p-6 rounded-xl border border-green-200 dark:border-green-700">
                <div class="text-2xl font-bold text-green-600 dark:text-white mb-1">RWF {{ Number(tontine.contribution_amount).toLocaleString() }}</div>
                <div class="text-sm text-gray-600 dark:text-white font-medium">Monthly Contribution</div>
                <div class="text-xs text-gray-500 dark:text-white mt-1">{{ tontine.contribution_frequency || 'monthly' }}</div>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
                <div class="text-2xl font-bold text-blue-600 dark:text-white mb-1">{{ tontine.members?.length || 0 }}/{{ tontine.max_members }}</div>
                <div class="text-sm text-gray-600 dark:text-white font-medium">Active Members</div>
                <div class="text-xs text-gray-500 dark:text-white mt-1">{{ tontine.max_members - (tontine.members?.length || 0) }} slots available</div>
              </div>
              <div class="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-xl border border-yellow-200 dark:border-yellow-700">
                <div class="text-2xl font-bold text-yellow-600 dark:text-white mb-1">RWF {{ Number(totalContributions).toLocaleString() }}</div>
                <div class="text-sm text-gray-600 dark:text-white font-medium">Total Pool</div>
                <div class="text-xs text-gray-500 dark:text-white mt-1">{{ tontine.contributions?.length || 0 }} contributions</div>
              </div>
              <div class="bg-purple-50 dark:bg-purple-900 p-6 rounded-xl border border-purple-200 dark:border-purple-700">
                <div class="text-2xl font-bold text-purple-600 dark:text-white mb-1">{{ formatDate(tontine.start_date) }}</div>
                <div class="text-sm text-gray-600 dark:text-white font-medium">Start Date</div>
                <div class="text-xs text-gray-500 dark:text-white mt-1">{{ tontine.end_date ? 'Ends ' + formatDate(tontine.end_date) : 'No end date' }}</div>
              </div>
            </div>
          </div>
        </UCard>
        
        <div class="grid lg:grid-cols-2 gap-8">
          <!-- Members Section -->
          <UCard class="shadow-lg bg-white dark:bg-gray-800">
            <template #header>
              <div class="flex justify-between items-center">
                <h3 class="text-xl font-semibold text-green-600 dark:text-white">Members ({{ tontine.members?.length || 0 }})</h3>
                <div class="flex gap-2">
                  <span color="blue" class="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{{ tontine.members?.filter(m => m.status === 'approved').length || 0 }} Active</span>
                  <UButton v-if="tontine.members?.length > 3" @click="showAllMembers = !showAllMembers" size="xs" variant="ghost">
                    {{ showAllMembers ? 'Show Less' : 'View All' }}
                  </UButton>
                </div>
              </div>
            </template>
            
            <div class="p-6">
              <div v-if="tontine.members?.length" class="space-y-4">
                <div v-for="(member, index) in displayedMembers" :key="member.id" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center border-2 border-green-200 dark:border-green-600">
                      <span class="text-green-600 dark:text-green-200 font-semibold text-sm">{{ member.names?.charAt(0) }}</span>
                    </div>
                    <div>
                      <div class="font-semibold text-gray-900 dark:text-white">{{ member.names }}</div>
                      <div class="text-sm text-gray-600 dark:text-white">{{ member.email }}</div>
                      <div class="text-xs text-gray-500 dark:text-white">Joined {{ formatDate(member.joined_at) }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span v-if="index === 0 && !showAllMembers" class="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">Latest</span>
                    <span :class="member.status === 'approved' ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ member.status }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-gray-500 dark:text-white py-8">
                <div class="text-lg font-medium mb-2">No members yet</div>
                <div class="text-sm">Be the first to join this tontine</div>
              </div>
            </div>
          </UCard>
          
          <!-- Recent Activity -->
          <UCard class="shadow-lg bg-white dark:bg-gray-800">
            <template #header>
              <div class="flex justify-between items-center">
                <h3 class="text-xl font-semibold text-green-600 dark:text-white">Recent Contributions</h3>
                <span class="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{{ approvedContributions }} Approved</span>
              </div>
            </template>
            
            <div class="p-6">
              <div v-if="tontine.contributions?.length" class="space-y-4">
                <div v-for="contribution in tontine.contributions.slice(0, 8)" :key="contribution.id" class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div class="font-semibold text-gray-900 dark:text-white">{{ contribution.names }}</div>
                    <div class="text-sm text-gray-600 dark:text-white">{{ formatDate(contribution.contribution_date) }}</div>
                    <div class="text-xs text-gray-500 dark:text-white">{{ contribution.payment_method || 'Bank Transfer' }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-green-600 dark:text-white text-lg">RWF {{ Number(contribution.amount).toLocaleString() }}</div>
                    <span :class="getStatusColor(contribution.payment_status) === 'green' ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300' : getStatusColor(contribution.payment_status) === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ contribution.payment_status }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-gray-500 dark:text-white py-8">
                <div class="text-lg font-medium mb-2">No contributions yet</div>
                <div class="text-sm">Contributions will appear here once members start paying</div>
              </div>
            </div>
          </UCard>
        </div>
        
        <!-- Financial Summary -->
        <UCard class="shadow-lg bg-white dark:bg-gray-800">
          <template #header>
            <h3 class="text-xl font-semibold text-green-600 dark:text-white">Financial Overview</h3>
          </template>
          
          <div class="p-6">
            <div class="grid md:grid-cols-3 gap-6">
              <div class="text-center p-6 bg-green-50 dark:bg-green-900 rounded-xl">
                <div class="text-3xl font-bold text-green-600 dark:text-white mb-2">RWF {{ Number(totalContributions).toLocaleString() }}</div>
                <div class="text-sm font-medium text-gray-600 dark:text-white">Total Contributions</div>
                <div class="text-xs text-gray-500 dark:text-white mt-1">From {{ approvedContributions }} payments</div>
              </div>
              <div class="text-center p-6 bg-blue-50 dark:bg-blue-900 rounded-xl">
                <div class="text-3xl font-bold text-blue-600 dark:text-white mb-2">RWF {{ Number(expectedMonthly).toLocaleString() }}</div>
                <div class="text-sm font-medium text-gray-600 dark:text-white">Expected Monthly</div>
                <div class="text-xs text-gray-500 dark:text-white mt-1">{{ tontine.members?.length || 0 }} × {{ Number(tontine.contribution_amount).toLocaleString() }}</div>
              </div>
              <div class="text-center p-6 bg-purple-50 dark:bg-purple-900 rounded-xl">
                <div class="text-3xl font-bold text-purple-600 dark:text-white mb-2">{{ collectionRate }}%</div>
                <div class="text-sm font-medium text-gray-600 dark:text-white">Collection Rate</div>
                <div class="text-xs text-gray-500 dark:text-white mt-1">This month's performance</div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
      
      <div v-else class="text-center py-12">
        <div class="text-red-500 dark:text-white text-xl font-semibold mb-2">Tontine not found</div>
        <div class="text-gray-500 dark:text-white">The requested tontine could not be loaded</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const loading = ref(true)
const tontine = ref({})
const tontineId = ref(route.query.id || '1')
const showAllMembers = ref(false)

const sortedMembers = computed(() => {
  if (!tontine.value.members) return []
  return [...tontine.value.members].sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at))
})

const displayedMembers = computed(() => {
  if (showAllMembers.value) return sortedMembers.value
  return sortedMembers.value.slice(0, 3)
})

const totalContributions = computed(() => {
  if (!tontine.value.contributions) return 0
  return tontine.value.contributions
    .filter(c => c.payment_status === 'Approved')
    .reduce((sum, c) => sum + Number(c.amount), 0)
})

const approvedContributions = computed(() => {
  return tontine.value.contributions?.filter(c => c.payment_status === 'Approved').length || 0
})

const expectedMonthly = computed(() => {
  const members = tontine.value.members?.length || 0
  const amount = Number(tontine.value.contribution_amount) || 0
  return members * amount
})

const collectionRate = computed(() => {
  if (!expectedMonthly.value) return 0
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const thisMonthContributions = tontine.value.contributions?.filter(c => {
    const contribDate = new Date(c.contribution_date)
    return contribDate.getMonth() === currentMonth && 
           contribDate.getFullYear() === currentYear &&
           c.payment_status === 'Approved'
  }).reduce((sum, c) => sum + Number(c.amount), 0) || 0
  
  return Math.round((thisMonthContributions / expectedMonthly.value) * 100)
})

onMounted(async () => {
  try {
    const response = await fetch(`http://localhost:8000/api/tontines/${tontineId.value}`)
    const data = await response.json()
    tontine.value = data
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
})

const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'Approved': return 'green'
    case 'Pending': return 'yellow'
    case 'Failed': return 'red'
    default: return 'gray'
  }
}

const manageTontine = (tontineId) => {
  navigateTo(`/manage?tontine=${tontineId}`)
}
</script>