<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">My Meetings</h1>
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

    <!-- Selected Tontine Meetings -->
    <div v-else>
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-semibold">{{ selectedTontine.name }} - Meetings</h2>
          <p class="text-gray-600 dark:text-gray-400">{{ selectedTontine.description }}</p>
        </div>
        <UButton @click="selectedTontine = null" variant="outline">
          Back to Tontines
        </UButton>
      </div>

      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Loading meetings...</p>
      </div>

      <div v-else-if="meetings.length === 0" class="text-center py-8">
        <p class="text-gray-600 dark:text-gray-400">No meetings found for this tontine.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Meeting</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date & Time</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">My Attendance</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="meeting in meetings" :key="meeting.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4">
                <div class="font-medium text-gray-900 dark:text-gray-100">{{ meeting.title }}</div>
                <div v-if="meeting.description" class="text-sm text-gray-500 dark:text-gray-400">{{ meeting.description }}</div>
                <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">Created by: {{ meeting.created_by_name }}</div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                {{ formatDate(meeting.meeting_date) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                {{ meeting.location }}
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-xs" :class="getStatusClass(meeting.status)">
                  {{ meeting.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span v-if="meeting.attendance_status" class="px-2 py-1 rounded text-xs" :class="getAttendanceClass(meeting.attendance_status)">
                  {{ meeting.attendance_status }}
                </span>
                <span v-else class="text-gray-400 dark:text-gray-500 text-sm">Not marked</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const meetings = ref([])
const userTontines = ref([])
const selectedTontine = ref(null)
const loading = ref(false)

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
  fetchMeetings(tontine.id)
}

const fetchMeetings = async (tontineId) => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:8000/api/meetings/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const allMeetings = await response.json()
      meetings.value = allMeetings.filter(m => m.tontine_id === tontineId)
    }
  } catch (error) {
    console.error('Error fetching meetings:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusClass = (status) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

const getAttendanceClass = (status) => {
  switch (status) {
    case 'present':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'absent':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'late':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'excused':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

onMounted(() => {
  fetchUserTontines()
})
</script>