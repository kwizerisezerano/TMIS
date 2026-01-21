<template>
  <div class="min-h-screen bg-white flex items-center justify-center p-4">
    <UCard class="w-full max-w-md border-0 shadow-lg">
      <div class="text-center p-6">
        <h1 class="text-2xl font-bold text-green-600">🌱 The Future</h1>
        <p class="text-gray-600">Membership Application</p>
      </div>

      <div class="p-6">
        <div v-if="submitted" class="text-center space-y-4">
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-green-700 font-medium">Application Submitted!</p>
            <p class="text-green-600 text-sm mt-2">
              Your membership application has been sent to our administrators. 
              You will be contacted within 2-3 business days.
            </p>
          </div>
          <UButton @click="resetForm" color="green" variant="outline">
            Submit Another Application
          </UButton>
        </div>

        <UForm v-else :state="form" @submit="handleSubmit" class="space-y-4">
          <UFormGroup label="Full Names" name="names" required>
            <UInput 
              v-model="form.names" 
              placeholder="Enter your full names" 
              size="lg" 
              required 
              :error="errors.names"
            />
            <p v-if="errors.names" class="text-red-500 text-xs mt-1">{{ errors.names }}</p>
          </UFormGroup>

          <UFormGroup label="Email Address" name="email" required>
            <UInput 
              v-model="form.email" 
              type="email" 
              placeholder="your@email.com" 
              size="lg" 
              required 
              :error="errors.email"
            />
            <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
          </UFormGroup>

          <UFormGroup label="Phone Number" name="phone" required>
            <UInput 
              v-model="form.phone" 
              placeholder="078XXXXXXX" 
              size="lg" 
              required 
              :error="errors.phone"
            />
            <p v-if="errors.phone" class="text-red-500 text-xs mt-1">{{ errors.phone }}</p>
          </UFormGroup>

          <UFormGroup label="Identity Document" name="document" required>
            <input 
              ref="fileInput"
              type="file" 
              @change="handleFileChange"
              accept=".pdf,.jpg,.jpeg,.png"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              required
            />
            <p class="text-xs text-gray-500 mt-1">Upload ID card, passport, or driver's license (PDF, JPG, PNG)</p>
          </UFormGroup>

          <UFormGroup label="Why do you want to join The Future?" name="reason">
            <UTextarea v-model="form.reason" placeholder="Tell us about your interest in joining..." :rows="3" />
          </UFormGroup>

          <UButton 
            type="submit" 
            :loading="loading" 
            class="w-full justify-center" 
            size="lg" 
            color="green"
            :disabled="!form.names || !form.email || !form.phone || !selectedFile"
          >
            Submit Application
          </UButton>
        </UForm>

        <div class="mt-4 text-center">
          <p class="text-sm text-gray-600">
            Already a member? 
            <NuxtLink to="/login" class="text-green-600 hover:underline">
              Login here
            </NuxtLink>
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
const form = reactive({
  names: '',
  email: '',
  phone: '',
  reason: ''
})

const loading = ref(false)
const submitted = ref(false)
const selectedFile = ref(null)
const fileInput = ref(null)
const errors = ref({})

const validateForm = () => {
  errors.value = {}
  
  // Validate names
  if (!form.names.trim()) {
    errors.value.names = 'Full names are required'
  } else if (form.names.trim().split(' ').length < 2) {
    errors.value.names = 'Please provide first and last name'
  }
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email.trim()) {
    errors.value.email = 'Email is required'
  } else if (!emailRegex.test(form.email)) {
    errors.value.email = 'Please enter a valid email address'
  }
  
  // Validate phone
  const phoneRegex = /^(078|079|072|073)\d{7}$/
  if (!form.phone.trim()) {
    errors.value.phone = 'Phone number is required'
  } else if (!phoneRegex.test(form.phone.replace(/\s+/g, ''))) {
    errors.value.phone = 'Please enter a valid Rwandan phone number (078XXXXXXX)'
  }
  
  // Validate file
  if (!selectedFile.value) {
    useToast().add({
      title: 'Document Required',
      description: 'Please upload your identity document',
      color: 'red'
    })
    return false
  }
  
  return Object.keys(errors.value).length === 0
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

const resetForm = () => {
  form.names = ''
  form.email = ''
  form.phone = ''
  form.reason = ''
  selectedFile.value = null
  errors.value = {}
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  submitted.value = false
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  
  try {
    const formData = new FormData()
    formData.append('names', form.names)
    formData.append('email', form.email)
    formData.append('phone', form.phone)
    formData.append('reason', form.reason)
    formData.append('document', selectedFile.value)
    
    const response = await fetch('http://localhost:8000/api/auth/apply', {
      method: 'POST',
      body: formData
    })
    
    if (response.ok) {
      submitted.value = true
    } else {
      const error = await response.json()
      useToast().add({
        title: 'Application Failed',
        description: error.message || 'Failed to submit application. Please try again.',
        color: 'red'
      })
    }
    
  } catch (error) {
    console.error('Application error:', error)
    useToast().add({
      title: 'Error',
      description: 'Unable to submit application. Please check your connection.',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

definePageMeta({
  layout: 'auth'
})
</script>