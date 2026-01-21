<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-xl mx-auto p-6">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-green-600">ID Number</h1>
          <p class="text-gray-600">Add or update your national ID number</p>
        </div>
        <UButton @click="navigateTo('/dashboard')" variant="outline">
          Back to Dashboard
        </UButton>
      </div>

      <!-- ID Number Form -->
      <UCard class="border-0 shadow-lg mb-6">
        <div class="p-6">
          <form @submit.prevent="updateIdNumber" class="space-y-6">
            <!-- ID Number -->
            <UFormGroup label="National ID Number" required>
              <UInput 
                v-model="idNumber" 
                placeholder="Enter your 16-digit ID number"
                size="lg"
                :disabled="hasIdNumber || loading"
                :class="hasIdNumber ? 'bg-gray-50' : ''"
                maxlength="16"
              />
              <template #help>
                <p v-if="hasIdNumber" class="text-xs text-green-600">✓ ID number verified and cannot be changed</p>
                <p v-else class="text-xs text-gray-500">Enter your 16-digit national ID number (cannot be changed once added)</p>
              </template>
            </UFormGroup>

            <!-- Save Button -->
            <div class="flex justify-end">
              <UButton 
                type="submit" 
                color="green" 
                size="lg"
                :loading="loading"
                :disabled="hasIdNumber || !idNumber || idNumber.length !== 16"
              >
                {{ hasIdNumber ? 'ID Number Added' : 'Add ID Number' }}
              </UButton>
            </div>
          </form>
        </div>
      </UCard>

      <!-- Contact Information -->
      <UCard class="border-0 shadow-lg">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-green-600 mb-4">Need to Update Other Information?</h2>
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-gray-700 mb-3">To change your name, email, or phone number, please contact the tontine leadership:</p>
            <div class="space-y-2 text-sm">
              <p><span class="font-medium">President:</span> Florien NDAGIJIMANA</p>
              <p><span class="font-medium">Secretary:</span> NIYONGOMBWA Didier</p>
              <p class="text-gray-600 mt-3">Changes to personal information require approval from the executive committee as per association constitution.</p>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const loading = ref(false)
const user = ref(null)
const idNumber = ref('')
const originalIdNumber = ref('')

const hasIdNumber = computed(() => {
  return originalIdNumber.value && originalIdNumber.value.length > 0
})

onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user')
    if (userData) {
      user.value = JSON.parse(userData)
      await loadUserProfile()
    }
  }
})

const loadUserProfile = async () => {
  try {
    const response = await fetch(`http://localhost:8000/api/auth/users/${user.value.id}`)
    const userData = await response.json()
    
    originalIdNumber.value = userData.id_number || ''
    idNumber.value = userData.id_number || ''
    
  } catch (error) {
    console.error('Failed to load profile:', error)
    const toast = useToast()
    toast.add({
      title: '❌ Error',
      description: 'Failed to load profile data',
      color: 'red'
    })
  }
}

const updateIdNumber = async () => {
  loading.value = true
  
  try {
    const response = await fetch(`http://localhost:8000/api/auth/users/${user.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_number: idNumber.value
      })
    })
    
    if (response.ok) {
      originalIdNumber.value = idNumber.value
      
      const toast = useToast()
      toast.add({
        title: '✅ Success',
        description: 'ID number added successfully',
        color: 'green'
      })
    } else {
      throw new Error('Update failed')
    }
    
  } catch (error) {
    console.error('Failed to update ID number:', error)
    const toast = useToast()
    toast.add({
      title: '❌ Error',
      description: 'Failed to update ID number',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

definePageMeta({
  layout: 'default'
})
</script>