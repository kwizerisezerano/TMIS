<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold" :class="headerClass">{{ title }}</h3>
      </template>
      
      <!-- Form Mode (Create/Edit) -->
      <div v-if="mode !== 'delete'" class="space-y-4">
        <UFormGroup label="Tontine Name" required>
          <UInput v-model="formData.name" placeholder="Enter tontine name" />
        </UFormGroup>
        
        <UFormGroup label="Description">
          <UTextarea v-model="formData.description" placeholder="Describe the tontine purpose" />
        </UFormGroup>
        
        <UFormGroup label="Monthly Contribution Amount (RWF)" required>
          <UInput v-model="formData.contribution_amount" type="number" placeholder="20000" />
        </UFormGroup>
        
        <UFormGroup label="Maximum Members" required>
          <UInput v-model="formData.max_members" type="number" placeholder="20" max="20" />
        </UFormGroup>
        
        <UFormGroup label="Start Date">
          <UInput v-model="formData.start_date" type="date" :min="today" />
        </UFormGroup>
        
        <UFormGroup label="End Date (Optional)">
          <UInput v-model="formData.end_date" type="date" :min="formData.start_date || today" />
        </UFormGroup>
      </div>

      <!-- Delete Mode -->
      <div v-else class="space-y-4">
        <div class="text-center">
          <div class="text-4xl mb-4">⚠️</div>
          <h4 class="text-lg font-medium text-gray-900">{{ tontine?.name }}</h4>
          <p class="text-gray-600 mt-2">Are you sure you want to delete this tontine?</p>
          <p class="text-red-600 text-sm mt-2 font-medium">This action cannot be undone and will remove all associated data.</p>
        </div>
        
        <div class="bg-red-50 p-4 rounded-lg">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium text-red-800">Members:</span>
              <div class="text-red-600">{{ tontine?.member_count || 0 }}</div>
            </div>
            <div>
              <span class="font-medium text-red-800">Total Contributions:</span>
              <div class="text-red-600">RWF {{ Number(tontine?.total_contributions || 0).toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex gap-2 justify-end">
          <UButton @click="cancel" variant="outline">Cancel</UButton>
          <UButton @click="confirm" :color="buttonColor" :loading="loading">
            {{ buttonText }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  mode: {
    type: String,
    default: 'create', // 'create', 'edit', 'delete'
    validator: (value) => ['create', 'edit', 'delete'].includes(value)
  },
  tontine: Object,
  loading: Boolean
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const today = new Date().toISOString().split('T')[0]

const formData = ref({
  name: '',
  description: '',
  contribution_amount: 20000,
  max_members: 20,
  start_date: '',
  end_date: ''
})

const title = computed(() => {
  switch (props.mode) {
    case 'create': return 'Create New Tontine'
    case 'edit': return 'Edit Tontine'
    case 'delete': return 'Delete Tontine'
    default: return 'Tontine'
  }
})

const headerClass = computed(() => {
  switch (props.mode) {
    case 'delete': return 'text-red-600'
    default: return 'text-green-600'
  }
})

const buttonText = computed(() => {
  switch (props.mode) {
    case 'create': return 'Create Tontine'
    case 'edit': return 'Update Tontine'
    case 'delete': return 'Yes, Delete Tontine'
    default: return 'Confirm'
  }
})

const buttonColor = computed(() => {
  return props.mode === 'delete' ? 'red' : 'green'
})

const confirm = () => {
  if (props.mode === 'delete') {
    emit('confirm')
  } else {
    emit('confirm', formData.value)
  }
}

const cancel = () => {
  emit('cancel')
  isOpen.value = false
}

// Watch for tontine changes to populate form
watch(() => props.tontine, (newTontine) => {
  if (newTontine && props.mode === 'edit') {
    formData.value = {
      id: newTontine.id,
      name: newTontine.name,
      description: newTontine.description,
      contribution_amount: newTontine.contribution_amount,
      max_members: newTontine.max_members,
      start_date: newTontine.start_date ? newTontine.start_date.split('T')[0] : '',
      end_date: newTontine.end_date ? newTontine.end_date.split('T')[0] : ''
    }
  }
}, { immediate: true })

// Reset form when modal closes
watch(isOpen, (newValue) => {
  if (!newValue && props.mode !== 'edit') {
    formData.value = {
      name: '',
      description: '',
      contribution_amount: 20000,
      max_members: 20,
      start_date: '',
      end_date: ''
    }
  }
})
</script>