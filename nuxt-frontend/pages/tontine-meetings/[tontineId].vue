<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Meetings Management</h1>
        <p v-if="tontine" class="text-gray-600 dark:text-gray-400">{{ tontine.name }}</p>
      </div>
      <UButton @click="showCreateModal = true" color="primary">
        Schedule Meeting
      </UButton>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading meetings...</p>
    </div>

    <div v-else-if="meetings.length === 0" class="text-center py-8">
      <p class="text-gray-600 dark:text-gray-400">No meetings scheduled.</p>
    </div>

    <div v-else class="space-y-4">
      <UCard v-for="meeting in meetings" :key="meeting.id" class="hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="font-semibold text-lg">{{ meeting.title }}</h3>
            <p v-if="meeting.description" class="text-gray-700 dark:text-gray-300 mb-3">{{ meeting.description }}</p>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
              <div>
                <span class="font-medium">Date:</span>
                <span class="ml-2">{{ formatDate(meeting.meeting_date) }}</span>
              </div>
              <div>
                <span class="font-medium">Location:</span>
                <span class="ml-2">{{ meeting.location }}</span>
              </div>
              <div>
                <span class="font-medium">Status:</span>
                <span class="ml-2 px-2 py-1 rounded text-xs" :class="getStatusClass(meeting.status)">
                  {{ meeting.status }}
                </span>
              </div>
              <div>
                <span class="font-medium">Created by:</span>
                <span class="ml-2">{{ meeting.created_by_name }}</span>
              </div>
            </div>

            <div v-if="meeting.total_members > 0" class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="font-medium">Total Members:</span>
                <span class="ml-2">{{ meeting.total_members }}</span>
              </div>
              <div>
                <span class="font-medium">Present:</span>
                <span class="ml-2 text-green-600">{{ meeting.present_count || 0 }}</span>
              </div>
              <div>
                <span class="font-medium">Absent:</span>
                <span class="ml-2 text-red-600">{{ meeting.absent_count || 0 }}</span>
              </div>
              <div>
                <span class="font-medium">Late:</span>
                <span class="ml-2 text-yellow-600">{{ meeting.late_count || 0 }}</span>
              </div>
            </div>
          </div>
          
          <div class="flex gap-2 ml-4">
            <UButton 
              v-if="meeting.status === 'scheduled'" 
              @click="markAttendance(meeting)" 
              size="sm" 
              color="green"
            >
              Mark Attendance
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Create Meeting Modal -->
    <UModal v-model="showCreateModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Schedule New Meeting</h3>
        </template>
        
        <form @submit.prevent="createMeeting" class="space-y-4">
          <UFormGroup label="Title" required>
            <UInput v-model="newMeeting.title" placeholder="Meeting title" />
          </UFormGroup>
          
          <UFormGroup label="Description">
            <UTextarea v-model="newMeeting.description" placeholder="Meeting description" />
          </UFormGroup>
          
          <UFormGroup label="Date & Time" required>
            <UInput v-model="newMeeting.meetingDate" type="datetime-local" :min="minDateTime" />
          </UFormGroup>
          
          <UFormGroup label="Location" required>
            <UInput v-model="newMeeting.location" placeholder="Meeting location" />
          </UFormGroup>
          
          <div class="flex justify-end gap-2">
            <UButton type="button" color="gray" @click="showCreateModal = false">
              Cancel
            </UButton>
            <UButton type="submit" color="primary" :loading="creating">
              Schedule Meeting
            </UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const route = useRoute()
const tontineId = route.params.tontineId

const meetings = ref([])
const tontine = ref(null)
const loading = ref(true)
const creating = ref(false)
const showCreateModal = ref(false)

const newMeeting = ref({
  title: '',
  description: '',
  meetingDate: '',
  location: ''
})

// Set minimum date to current date/time
const minDateTime = computed(() => {
  const now = new Date()
  return now.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
})

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

const fetchMeetings = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:8000/api/meetings/tontine/${tontineId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      meetings.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching meetings:', error)
  } finally {
    loading.value = false
  }
}

const createMeeting = async () => {
  creating.value = true
  try {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user'))
    
    const response = await fetch('http://localhost:8000/api/meetings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tontineId: parseInt(tontineId),
        title: newMeeting.value.title,
        description: newMeeting.value.description,
        meetingDate: newMeeting.value.meetingDate,
        location: newMeeting.value.location,
        createdBy: user.id
      })
    })
    
    if (response.ok) {
      showCreateModal.value = false
      newMeeting.value = { title: '', description: '', meetingDate: '', location: '' }
      await fetchMeetings()
    }
  } catch (error) {
    console.error('Error creating meeting:', error)
  } finally {
    creating.value = false
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

const markAttendance = (meeting) => {
  navigateTo(`/tontine-meetings-attendance/${meeting.id}`)
}

onMounted(() => {
  fetchTontine()
  fetchMeetings()
})
</script>