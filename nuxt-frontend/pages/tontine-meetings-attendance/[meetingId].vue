<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Mark Attendance</h1>
        <p v-if="meeting" class="text-gray-600 dark:text-gray-400">{{ meeting.title }} - {{ formatDate(meeting.meeting_date) }}</p>
      </div>
      <UButton @click="$router.back()" variant="outline">
        Back
      </UButton>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading attendance...</p>
    </div>

    <div v-else-if="attendance.length === 0" class="text-center py-8">
      <p class="text-gray-600 dark:text-gray-400">No members found.</p>
    </div>

    <div v-else>
      <div class="overflow-x-auto mb-6">
        <table class="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="member in attendance" :key="member.user_id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4">
                <div class="font-medium text-gray-900 dark:text-gray-100">{{ member.names }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ member.email }}</div>
              </td>
              <td class="px-6 py-4">
                <select 
                  v-model="member.status" 
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end">
        <UButton @click="saveAttendance" color="green" :loading="saving">
          Save Attendance
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const meetingId = route.params.meetingId

const meeting = ref(null)
const attendance = ref([])
const loading = ref(true)
const saving = ref(false)

const fetchMeetingAndAttendance = async () => {
  try {
    const token = localStorage.getItem('token')
    
    // Fetch meeting details
    const meetingResponse = await fetch(`http://localhost:8000/api/meetings/tontine/1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (meetingResponse.ok) {
      const meetings = await meetingResponse.json()
      meeting.value = meetings.find(m => m.id == meetingId)
    }

    // Fetch attendance
    const attendanceResponse = await fetch(`http://localhost:8000/api/meetings/${meetingId}/attendance`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (attendanceResponse.ok) {
      attendance.value = await attendanceResponse.json()
    }
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    loading.value = false
  }
}

const saveAttendance = async () => {
  saving.value = true
  try {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user'))
    
    const response = await fetch(`http://localhost:8000/api/meetings/${meetingId}/attendance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        attendance: attendance.value,
        markedBy: user.id
      })
    })
    
    if (response.ok) {
      router.back()
    }
  } catch (error) {
    console.error('Error saving attendance:', error)
  } finally {
    saving.value = false
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

onMounted(() => {
  fetchMeetingAndAttendance()
})
</script>