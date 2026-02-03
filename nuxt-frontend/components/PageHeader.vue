<template>
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-green-600">{{ title }}</h1>
      <p class="text-gray-600">{{ description }}</p>
    </div>
    <div class="flex gap-4">
      <slot name="actions" />
      <UButton v-if="showBackButton" @click="navigateTo('/dashboard')" variant="outline" icon="i-heroicons-arrow-left">
        Back to Dashboard
      </UButton>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  showBackButton: { type: Boolean, default: true }
})
</script>