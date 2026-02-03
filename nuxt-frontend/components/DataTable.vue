<template>
  <div>
    <!-- Search and Filters -->
    <div class="mb-4 flex flex-col sm:flex-row gap-4">
      <input 
        v-model="searchQuery" 
        :placeholder="searchPlaceholder" 
        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" 
      />
      <USelect 
        v-if="filters.length > 0"
        v-model="selectedFilter" 
        :options="filters" 
        class="w-full sm:w-32" 
      />
    </div>

    <!-- Table -->
    <LoadingSpinner v-if="loading" :text="loadingText" />
    
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th 
              v-for="column in columns" 
              :key="column.key"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="item in paginatedData" :key="item.id" class="hover:bg-gray-50">
            <td 
              v-for="column in columns" 
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap"
              :class="column.class || 'text-sm text-gray-900'"
            >
              <slot :name="column.key" :item="item" :value="getNestedValue(item, column.key)">
                {{ formatValue(getNestedValue(item, column.key), column.type) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="mt-4 flex justify-between items-center">
      <div class="text-sm text-gray-500">
        Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredData.length) }} of {{ filteredData.length }} {{ itemName }}
      </div>
      <UPagination 
        v-if="totalPages > 1" 
        v-model="currentPage" 
        :page-count="totalPages" 
        :total="filteredData.length" 
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: 'Search...' },
  loadingText: { type: String, default: 'Loading...' },
  itemName: { type: String, default: 'items' },
  filters: { type: Array, default: () => [] },
  itemsPerPage: { type: Number, default: 6 }
})

const searchQuery = ref('')
const selectedFilter = ref('')
const currentPage = ref(1)

// Memoized search function for better performance
const searchInItem = (item, query, columns) => {
  return columns.some(column => {
    const value = getNestedValue(item, column.key)
    return String(value || '').toLowerCase().includes(query)
  })
}

const filteredData = computed(() => {
  let filtered = props.data
  
  // Search across all fields with memoization
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => searchInItem(item, query, props.columns))
  }
  
  // Apply filter
  if (selectedFilter.value && props.filters.length > 0) {
    const filterConfig = props.filters.find(f => f.value === selectedFilter.value)
    if (filterConfig && filterConfig.filterFn) {
      filtered = filtered.filter(filterConfig.filterFn)
    }
  }
  
  return filtered
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / props.itemsPerPage))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return filteredData.value.slice(start, end)
})

// Reset pagination when search/filter changes
watch([searchQuery, selectedFilter], () => {
  currentPage.value = 1
})

// Optimized nested value getter with caching
const valueCache = new Map()
const getNestedValue = (obj, path) => {
  const cacheKey = `${obj.id}-${path}`
  if (valueCache.has(cacheKey)) {
    return valueCache.get(cacheKey)
  }
  
  const value = path.split('.').reduce((current, key) => current?.[key], obj)
  valueCache.set(cacheKey, value)
  return value
}

const formatValue = (value, type) => {
  if (!value && value !== 0) return ''
  
  switch (type) {
    case 'currency':
      return `RWF ${Number(value).toLocaleString()}`
    case 'date':
      return new Date(value).toLocaleDateString()
    case 'status':
      return String(value).charAt(0).toUpperCase() + String(value).slice(1)
    default:
      return value
  }
}

// Clear cache when data changes
watch(() => props.data, () => {
  valueCache.clear()
})
</script>