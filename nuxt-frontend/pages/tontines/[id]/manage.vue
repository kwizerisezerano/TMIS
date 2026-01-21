<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-3xl font-bold text-red-600 mb-4">MANAGE PAGE WORKS!</h1>
      <h2 class="text-2xl font-bold text-green-600 mb-4">Tontine Management</h2>
      
      <div class="mb-4">
        <p class="text-lg">Tontine ID: {{ $route.params.id }}</p>
      </div>
      
      <UButton @click="navigateTo(`/tontines/${$route.params.id}`)" variant="outline" class="mb-6">
        Back to Tontine Details
      </UButton>
      
      <div v-if="loading" class="mt-6 text-center">
        <p>Loading tontine data...</p>
      </div>
      
      <div v-else-if="tontine.name" class="mt-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-xl font-semibold mb-3">Tontine Settings</h3>
            <p><strong>Name:</strong> {{ tontine.name }}</p>
            <p><strong>Description:</strong> {{ tontine.description }}</p>
            <p><strong>Contribution:</strong> ${{ tontine.contribution_amount }}</p>
            <p><strong>Max Members:</strong> {{ tontine.max_members }}</p>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-xl font-semibold mb-3">Management Actions</h3>
            <UButton color="primary" class="mb-2 w-full">Edit Settings</UButton>
            <UButton color="red" variant="outline" class="w-full">Delete Tontine</UButton>
          </div>
        </div>
        
        <div class="mt-6">
          <h3 class="text-xl font-semibold mb-3">Members ({{ tontine.members?.length || 0 }})</h3>
          <div v-if="tontine.members?.length" class="bg-white border rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left">Name</th>
                  <th class="px-4 py-2 text-left">Email</th>
                  <th class="px-4 py-2 text-left">Status</th>
                  <th class="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="member in tontine.members" :key="member.id" class="border-t">
                  <td class="px-4 py-2">{{ member.names }}</td>
                  <td class="px-4 py-2">{{ member.email }}</td>
                  <td class="px-4 py-2">
                    <span class="px-2 py-1 text-xs rounded-full" 
                          :class="member.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'">
                      {{ member.status }}
                    </span>
                  </td>
                  <td class="px-4 py-2">
                    <UButton color="red" size="xs" variant="outline">Remove</UButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            No members found
          </div>
        </div>
      </div>
      
      <div v-else class="mt-6 text-center text-red-500">
        <p>Tontine not found or failed to load</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const loading = ref(true)
const tontine = ref({})

onMounted(async () => {
  const id = useRoute().params.id
  console.log('Loading tontine management for ID:', id)
  
  try {
    const response = await fetch(`http://localhost:8000/api/tontines/${id}`)
    const data = await response.json()
    tontine.value = data
    console.log('Tontine data loaded:', data)
  } catch (error) {
    console.error('Error loading tontine:', error)
  } finally {
    loading.value = false
  }
})
</script>