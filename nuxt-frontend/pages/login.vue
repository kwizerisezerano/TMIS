<template>
  <div class="min-h-screen bg-white flex items-center justify-center p-4">
    <UCard class="w-full max-w-md border-0 shadow-lg">
      <div class="text-center p-6">
        <h1 class="text-2xl font-bold text-green-600">🌱 The Future</h1>
        <p class="text-gray-600">Digital Tontine Platform</p>
      </div>

      <div class="p-6">
        <!-- Error Message Display -->
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-700 text-sm">{{ errorMessage }}</p>
        </div>
        
        <!-- Success Message Display -->
        <div v-if="successMessage" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-green-700 text-sm">{{ successMessage }}</p>
        </div>

        <UForm :state="form" @submit="handleLogin" class="space-y-4">
          <UFormGroup label="Email" name="email">
            <UInput v-model="form.email" type="email" placeholder="your@email.com" size="lg" required />
          </UFormGroup>

          <UFormGroup label="Password" name="password">
            <div class="relative">
              <UInput v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="Password" size="lg" required />
              <button @click="showPassword = !showPassword" type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10">
                <Icon :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="w-5 h-5" />
              </button>
            </div>
          </UFormGroup>

          <UButton type="submit" :loading="loading" class="w-full justify-center" size="lg" color="green" trailing-icon="i-heroicons-arrow-right">
            Login to The Future
          </UButton>
        </UForm>

        <div class="mt-4 text-center">
          <p class="text-sm text-gray-600">
            Want to join The Future? 
            <NuxtLink to="/apply" class="text-green-600 hover:underline">
              Apply for membership
            </NuxtLink>
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
const form = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showPassword = ref(false)

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: form.email,
        password: form.password
      })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success && data.token) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      successMessage.value = `Welcome back, ${data.user.names}!`
      
      // Redirect after showing success message
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } else {
      // Show error message from backend
      errorMessage.value = data.message || 'Invalid credentials. Please try again.'
      
      if (data.requiresVerification) {
        errorMessage.value = 'Please verify your email before logging in.'
      }
    }
    
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'Unable to connect to server. Please try again.'
  } finally {
    loading.value = false
  }
}

definePageMeta({
  layout: 'auth'
})
</script>