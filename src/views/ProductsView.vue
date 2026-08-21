<script setup>
import { onMounted, ref, computed } from 'vue'

const products = ref([])
const loading = ref(false)
const error = ref('')

const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)

// =========================================================
// FILTERS
// =========================================================

const productName = ref('')
const category = ref('')
const status = ref('')
const minPrice = ref('')
const maxPrice = ref('')

// =========================================================
// ADD SINGLE PRODUCT
// =========================================================

const showAddModal = ref(false)
const addingProduct = ref(false)
const addError = ref('')

const newProduct = ref({
  productName: '',
  productPrice: '',
  category: '',
  totalStock: '',
})

// =========================================================
// BULK ADD PRODUCTS
// =========================================================

const showBulkModal = ref(false)
const addingBulkProducts = ref(false)
const bulkError = ref('')

const bulkProducts = ref([
  {
    productName: '',
    productPrice: '',
    category: '',
    totalStock: '',
  },
])

// =========================================================
// EDIT PRODUCT
// =========================================================

const showEditModal = ref(false)
const editingProduct = ref(false)
const editError = ref('')

const editProductData = ref({
  productId: null,
  productName: '',
  productPrice: '',
  category: '',
  totalStock: '',
})

// =========================================================
// DELETE PRODUCT
// =========================================================

const showDeleteModal = ref(false)
const deletingProduct = ref(false)
const deleteError = ref('')
const productToDelete = ref(null)

// =========================================================
// SUMMARY
// =========================================================

const availableProducts = computed(() => {
  return products.value.filter(
    product => product.status === 'AVAILABLE'
  ).length
})

const outOfStockProducts = computed(() => {
  return products.value.filter(
    product => product.status === 'OUT_OF_STOCK'
  ).length
})

const totalStockUnits = computed(() => {
  return products.value.reduce(
    (total, product) => total + (product.totalStock || 0),
    0
  )
})

const lowStockProducts = computed(() => {
  return products.value.filter(product => {
    if (!product.totalStock) return false

    return (
      product.remainingStock > 0 &&
      product.remainingStock <= product.totalStock * 0.25
    )
  }).length
})

const inventoryHealth = computed(() => {
  if (!products.value.length) return 0

  const healthy = products.value.filter(product => {
    if (!product.totalStock) return false
    return product.remainingStock > product.totalStock * 0.25
  }).length

  return Math.round((healthy / products.value.length) * 100)
})

// =========================================================
// FETCH PRODUCTS
// =========================================================

const fetchProducts = async () => {
  loading.value = true
  error.value = ''

  try {
    const params = new URLSearchParams()

    params.append('page', currentPage.value)
    params.append('size', 10)
    params.append('sortBy', 'productId')
    params.append('sortDirection', 'asc')

    if (productName.value) {
      params.append('productName', productName.value)
    }

    if (category.value) {
      params.append('category', category.value)
    }

    if (status.value) {
      params.append('status', status.value)
    }

    if (minPrice.value) {
      params.append('minPrice', minPrice.value)
    }

    if (maxPrice.value) {
      params.append('maxPrice', maxPrice.value)
    }

    const response = await fetch(
      `http://localhost:8080/api/products?${params.toString()}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }

    const result = await response.json()

    products.value = result.data.content
    totalPages.value = result.data.totalPages
    totalElements.value = result.data.totalElements
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// =========================================================
// FILTERS
// =========================================================

const applyFilters = () => {
  currentPage.value = 0
  fetchProducts()
}

const clearFilters = () => {
  productName.value = ''
  category.value = ''
  status.value = ''
  minPrice.value = ''
  maxPrice.value = ''

  currentPage.value = 0

  fetchProducts()
}

// =========================================================
// PAGINATION
// =========================================================

const nextPage = () => {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++
    fetchProducts()
  }
}

const previousPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--
    fetchProducts()
  }
}

// =========================================================
// ADD SINGLE PRODUCT
// =========================================================

const addProduct = async () => {
  addError.value = ''

  if (!newProduct.value.productName.trim()) {
    addError.value = 'Product name is required.'
    return
  }

  if (
    newProduct.value.productPrice === '' ||
    Number(newProduct.value.productPrice) < 0
  ) {
    addError.value = 'Please enter a valid price.'
    return
  }

  if (!newProduct.value.category.trim()) {
    addError.value = 'Category is required.'
    return
  }

  if (
    newProduct.value.totalStock === '' ||
    Number(newProduct.value.totalStock) < 0
  ) {
    addError.value = 'Please enter a valid stock quantity.'
    return
  }

  addingProduct.value = true

  try {
    const response = await fetch(
      'http://localhost:8080/api/products',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: newProduct.value.productName.trim(),
          productPrice: Number(newProduct.value.productPrice),
          category: newProduct.value.category.trim(),
          totalStock: Number(newProduct.value.totalStock),
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to create product'
      )
    }

    showAddModal.value = false

    resetAddForm()

    currentPage.value = 0

    await fetchProducts()
  } catch (err) {
    addError.value = err.message
  } finally {
    addingProduct.value = false
  }
}

const resetAddForm = () => {
  newProduct.value = {
    productName: '',
    productPrice: '',
    category: '',
    totalStock: '',
  }

  addError.value = ''
}

const openAddModal = () => {
  resetAddForm()
  showAddModal.value = true
}

const closeAddModal = () => {
  if (addingProduct.value) {
    return
  }

  showAddModal.value = false
  resetAddForm()
}

// =========================================================
// BULK ADD PRODUCTS
// =========================================================

const createEmptyBulkProduct = () => {
  return {
    productName: '',
    productPrice: '',
    category: '',
    totalStock: '',
  }
}

const addBulkRow = () => {
  bulkProducts.value.push(createEmptyBulkProduct())
}

const removeBulkRow = index => {
  if (bulkProducts.value.length === 1) {
    return
  }

  bulkProducts.value.splice(index, 1)
}

const resetBulkForm = () => {
  bulkProducts.value = [
    createEmptyBulkProduct(),
  ]

  bulkError.value = ''
}

const openBulkModal = () => {
  resetBulkForm()
  showBulkModal.value = true
}

const closeBulkModal = () => {
  if (addingBulkProducts.value) {
    return
  }

  showBulkModal.value = false
  resetBulkForm()
}

const addBulkProducts = async () => {
  bulkError.value = ''

  if (bulkProducts.value.length === 0) {
    bulkError.value = 'Please add at least one product.'
    return
  }

  for (let i = 0; i < bulkProducts.value.length; i++) {
    const product = bulkProducts.value[i]

    if (!product.productName.trim()) {
      bulkError.value = `Product ${i + 1}: Product name is required.`
      return
    }

    if (
      product.productPrice === '' ||
      Number(product.productPrice) < 0
    ) {
      bulkError.value = `Product ${i + 1}: Please enter a valid price.`
      return
    }

    if (!product.category.trim()) {
      bulkError.value = `Product ${i + 1}: Category is required.`
      return
    }

    if (
      product.totalStock === '' ||
      Number(product.totalStock) < 0
    ) {
      bulkError.value = `Product ${i + 1}: Please enter a valid stock quantity.`
      return
    }
  }

  addingBulkProducts.value = true

  try {
    const payload = bulkProducts.value.map(product => ({
      productName: product.productName.trim(),
      productPrice: Number(product.productPrice),
      category: product.category.trim(),
      totalStock: Number(product.totalStock),
    }))

    const response = await fetch(
      'http://localhost:8080/api/products/bulk',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to create products'
      )
    }

    showBulkModal.value = false

    resetBulkForm()

    currentPage.value = 0

    await fetchProducts()
  } catch (err) {
    bulkError.value = err.message
  } finally {
    addingBulkProducts.value = false
  }
}

// =========================================================
// EDIT PRODUCT
// =========================================================

const openEditModal = product => {
  editError.value = ''

  editProductData.value = {
    productId: product.productId,
    productName: product.productName,
    productPrice: product.productPrice,
    category: product.category,
    totalStock: product.totalStock,
  }

  showEditModal.value = true
}

const closeEditModal = () => {
  if (editingProduct.value) {
    return
  }

  showEditModal.value = false
  editError.value = ''

  editProductData.value = {
    productId: null,
    productName: '',
    productPrice: '',
    category: '',
    totalStock: '',
  }
}

const updateProduct = async () => {
  editError.value = ''

  if (!editProductData.value.productName.trim()) {
    editError.value = 'Product name is required.'
    return
  }

  if (
    editProductData.value.productPrice === '' ||
    Number(editProductData.value.productPrice) < 0
  ) {
    editError.value = 'Please enter a valid price.'
    return
  }

  if (!editProductData.value.category.trim()) {
    editError.value = 'Category is required.'
    return
  }

  if (
    editProductData.value.totalStock === '' ||
    Number(editProductData.value.totalStock) < 0
  ) {
    editError.value = 'Please enter a valid stock quantity.'
    return
  }

  editingProduct.value = true

  try {
    const response = await fetch(
      'http://localhost:8080/api/products',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: editProductData.value.productId,
          productName: editProductData.value.productName.trim(),
          productPrice: Number(editProductData.value.productPrice),
          category: editProductData.value.category.trim(),
          totalStock: Number(editProductData.value.totalStock),
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.message || 'Failed to update product'
      )
    }

    showEditModal.value = false
    editError.value = ''

    await fetchProducts()
  } catch (err) {
    editError.value = err.message
  } finally {
    editingProduct.value = false
  }
}

// =========================================================
// DELETE PRODUCT
// =========================================================

const openDeleteModal = product => {
  productToDelete.value = product
  deleteError.value = ''
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  if (deletingProduct.value) {
    return
  }

  showDeleteModal.value = false
  deleteError.value = ''
  productToDelete.value = null
}

const deleteProduct = async () => {
  if (!productToDelete.value) {
    return
  }

  deletingProduct.value = true
  deleteError.value = ''

  try {
    const response = await fetch(
      `http://localhost:8080/api/products/${productToDelete.value.productId}`,
      {
        method: 'DELETE',
      }
    )

    let result = null

    try {
      result = await response.json()
    } catch {
      result = null
    }

    if (!response.ok) {
      throw new Error(
        result?.message || 'Failed to delete product'
      )
    }

    showDeleteModal.value = false
    productToDelete.value = null

    await fetchProducts()
  } catch (err) {
    deleteError.value = err.message
  } finally {
    deletingProduct.value = false
  }
}

// =========================================================
// HELPERS
// =========================================================

const getInitials = name => {
  if (!name) return 'P'

  const words = name.trim().split(' ')

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }

  return (
    words[0].charAt(0) +
    words[1].charAt(0)
  ).toUpperCase()
}

const getStockPercentage = product => {
  if (!product.totalStock) return 0

  return Math.min(
    (product.remainingStock / product.totalStock) * 100,
    100
  )
}

const getStockLabel = product => {
  if (product.remainingStock === 0) {
    return 'Out of stock'
  }

  if (
    product.totalStock > 0 &&
    product.remainingStock <= product.totalStock * 0.25
  ) {
    return 'Low stock'
  }

  return 'Healthy'
}

// =========================================================
// INITIAL LOAD
// =========================================================

onMounted(() => {
  fetchProducts()
})
</script>

<template>

  <div class="min-h-screen bg-[#f5f7fb] text-slate-900">

    <!-- ================================================= -->
    <!-- PREMIUM HERO -->
    <!-- ================================================= -->

    <section class="relative overflow-hidden bg-slate-950">

      <!-- Background glow -->
      <div
        class="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl"
      ></div>

      <div
        class="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl"
      ></div>

      <div
        class="pointer-events-none absolute bottom-0 left-1/3 h-40 w-96 rounded-full bg-blue-500/10 blur-3xl"
      ></div>

      <div class="relative mx-auto max-w-[1600px] px-6 py-8 lg:px-10 lg:py-10">

        <div class="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">

          <!-- Branding -->

          <div>

            <div class="mb-5 flex items-center gap-3">

              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl"
              >
                <span class="text-xl text-indigo-300">
                  ◈
                </span>
              </div>

              <div>

                <div class="text-xs font-bold uppercase tracking-[0.25em] text-indigo-300">
                  Inventory OS
                </div>

                <div class="mt-0.5 text-xs text-slate-500">
                  Operations & Stock Management
                </div>

              </div>

            </div>

            <h1
              class="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Product
              <span class="text-indigo-400">
                Intelligence
              </span>
            </h1>

            <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              A centralized workspace to monitor products, inventory
              health, pricing and availability across your catalogue.
            </p>

          </div>

          <!-- Actions -->

          <div class="flex flex-col gap-3 sm:flex-row">

            <button
              @click="openBulkModal"
              class="group flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold text-white shadow-xl backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
            >

              <span
                class="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-indigo-300 transition group-hover:bg-indigo-500/20"
              >
                ▦
              </span>

              Bulk Import

            </button>

            <button
              @click="openAddModal"
              class="group flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-slate-950 shadow-2xl shadow-indigo-950/40 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-50"
            >

              <span
                class="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white transition group-hover:scale-110"
              >
                +
              </span>

              Add Product

            </button>

          </div>

        </div>

        <!-- Hero mini metrics -->

        <div class="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">

          <div
            class="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
          >

            <div class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Catalogue
            </div>

            <div class="mt-2 text-2xl font-black text-white">
              {{ totalElements }}
            </div>

          </div>

          <div
            class="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
          >

            <div class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Available
            </div>

            <div class="mt-2 text-2xl font-black text-emerald-400">
              {{ availableProducts }}
            </div>

          </div>

          <div
            class="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
          >

            <div class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Low Stock
            </div>

            <div class="mt-2 text-2xl font-black text-amber-400">
              {{ lowStockProducts }}
            </div>

          </div>

          <div
            class="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
          >

            <div class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Health
            </div>

            <div class="mt-2 flex items-end gap-2">

              <span class="text-2xl font-black text-white">
                {{ inventoryHealth }}%
              </span>

              <span class="mb-1 text-xs text-slate-500">
                healthy
              </span>

            </div>

          </div>

        </div>

      </div>

    </section>

    <!-- ================================================= -->
    <!-- MAIN -->
    <!-- ================================================= -->

    <main class="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">

      <!-- ================================================= -->
      <!-- KPI CARDS -->
      <!-- ================================================= -->

      <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <!-- Total -->

        <div
          class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >

          <div
            class="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-100 opacity-50 blur-2xl"
          ></div>

          <div class="relative">

            <div class="flex items-start justify-between">

              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-600"
              >
                ▦
              </div>

              <span
                class="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600"
              >
                Catalogue
              </span>

            </div>

            <p class="mt-6 text-sm font-semibold text-slate-400">
              Total Products
            </p>

            <div class="mt-1 text-4xl font-black tracking-tight text-slate-900">
              {{ totalElements }}
            </div>

            <p class="mt-3 text-xs text-slate-400">
              Active products in your catalogue
            </p>

          </div>

        </div>

        <!-- Available -->

        <div
          class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >

          <div
            class="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100 opacity-50 blur-2xl"
          ></div>

          <div class="relative">

            <div class="flex items-start justify-between">

              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-600"
              >
                ✓
              </div>

              <span
                class="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600"
              >
                Healthy
              </span>

            </div>

            <p class="mt-6 text-sm font-semibold text-slate-400">
              Available Products
            </p>

            <div class="mt-1 text-4xl font-black tracking-tight text-emerald-600">
              {{ availableProducts }}
            </div>

            <p class="mt-3 text-xs text-slate-400">
              Products currently ready for sale
            </p>

          </div>

        </div>

        <!-- Low Stock -->

        <div
          class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >

          <div
            class="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-100 opacity-60 blur-2xl"
          ></div>

          <div class="relative">

            <div class="flex items-start justify-between">

              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-xl text-amber-600"
              >
                !
              </div>

              <span
                class="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600"
              >
                Attention
              </span>

            </div>

            <p class="mt-6 text-sm font-semibold text-slate-400">
              Low Stock
            </p>

            <div class="mt-1 text-4xl font-black tracking-tight text-amber-600">
              {{ lowStockProducts }}
            </div>

            <p class="mt-3 text-xs text-slate-400">
              Products approaching restock threshold
            </p>

          </div>

        </div>

        <!-- Units -->

        <div
          class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >

          <div
            class="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-100 opacity-50 blur-2xl"
          ></div>

          <div class="relative">

            <div class="flex items-start justify-between">

              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-xl text-violet-600"
              >
                ◫
              </div>

              <span
                class="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-600"
              >
                Units
              </span>

            </div>

            <p class="mt-6 text-sm font-semibold text-slate-400">
              Inventory Units
            </p>

            <div class="mt-1 text-4xl font-black tracking-tight text-slate-900">
              {{ totalStockUnits }}
            </div>

            <p class="mt-3 text-xs text-slate-400">
              Total stock across this page
            </p>

          </div>

        </div>

      </div>

      <!-- ================================================= -->
      <!-- SEARCH / FILTER -->
      <!-- ================================================= -->

      <section
        class="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >

        <div class="border-b border-slate-100 px-6 py-5 lg:px-7">

          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div class="flex items-center gap-3">

                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                >
                  ⌕
                </div>

                <div>

                  <h2 class="font-black text-slate-900">
                    Search & Filter
                  </h2>

                  <p class="mt-0.5 text-xs text-slate-400">
                    Find exactly what you're looking for
                  </p>

                </div>

              </div>

            </div>

            <button
              @click="clearFilters"
              class="self-start rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:self-auto"
            >
              ↻ Reset all filters
            </button>

          </div>

        </div>

        <div class="p-6 lg:p-7">

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">

            <!-- Product -->

            <div class="lg:col-span-4">

              <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Product
              </label>

              <div class="relative">

                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  ⌕
                </span>

                <input
                  v-model="productName"
                  @keyup.enter="applyFilters"
                  type="text"
                  placeholder="Search product name..."
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />

              </div>

            </div>

            <!-- Category -->

            <div class="lg:col-span-2">

              <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Category
              </label>

              <input
                v-model="category"
                @keyup.enter="applyFilters"
                type="text"
                placeholder="All categories"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />

            </div>

            <!-- Status -->

            <div class="lg:col-span-2">

              <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Status
              </label>

              <select
                v-model="status"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              >

                <option value="">
                  All Status
                </option>

                <option value="AVAILABLE">
                  Available
                </option>

                <option value="OUT_OF_STOCK">
                  Out of Stock
                </option>

              </select>

            </div>

            <!-- Min -->

            <div class="lg:col-span-1">

              <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Min ₹
              </label>

              <input
                v-model="minPrice"
                @keyup.enter="applyFilters"
                type="number"
                min="0"
                placeholder="0"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />

            </div>

            <!-- Max -->

            <div class="lg:col-span-1">

              <label class="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Max ₹
              </label>

              <input
                v-model="maxPrice"
                @keyup.enter="applyFilters"
                type="number"
                min="0"
                placeholder="∞"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />

            </div>

            <!-- Search -->

            <div class="flex items-end lg:col-span-2">

              <button
                @click="applyFilters"
                class="w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-indigo-700 hover:shadow-indigo-200"
              >
                Search
              </button>

            </div>

          </div>

        </div>

      </section>

      <!-- ================================================= -->
      <!-- ERROR -->
      <!-- ================================================= -->

      <div
        v-if="error"
        class="mb-7 rounded-3xl border border-rose-200 bg-rose-50 p-5"
      >

        <div class="flex items-start gap-4">

          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 font-black text-rose-600"
          >
            !
          </div>

          <div class="flex-1">

            <p class="font-black text-rose-900">
              Unable to load inventory
            </p>

            <p class="mt-1 text-sm text-rose-600">
              {{ error }}
            </p>

            <button
              @click="fetchProducts"
              class="mt-3 rounded-lg text-xs font-black text-rose-700 underline"
            >
              Try again
            </button>

          </div>

        </div>

      </div>

      <!-- ================================================= -->
      <!-- PRODUCT TABLE -->
      <!-- ================================================= -->

      <section
        class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >

        <!-- Header -->

        <div class="border-b border-slate-100 px-6 py-6 lg:px-7">

          <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

            <div>

              <div class="flex items-center gap-3">

                <h2 class="text-xl font-black tracking-tight text-slate-900">
                  Product Catalogue
                </h2>

                <span
                  class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"
                >
                  {{ totalElements }}
                </span>

              </div>

              <p class="mt-1.5 text-sm text-slate-400">
                Manage your products and monitor stock levels.
              </p>

            </div>

            <div class="flex items-center gap-3">

              <div
                class="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"
              >

                <span class="h-2 w-2 rounded-full bg-emerald-500"></span>

                <span class="text-xs font-bold text-slate-500">
                  Live inventory
                </span>

              </div>

              <div class="text-xs text-slate-400">

                Page

                <span class="font-black text-slate-700">
                  {{ currentPage + 1 }}
                </span>

                /

                <span class="font-black text-slate-700">
                  {{ totalPages || 1 }}
                </span>

              </div>

            </div>

          </div>

        </div>

        <!-- Loading -->

        <div
          v-if="loading"
          class="p-6"
        >

          <div class="hidden space-y-4 md:block">

            <div
              v-for="n in 6"
              :key="n"
              class="flex animate-pulse items-center gap-5 rounded-2xl border border-slate-100 p-5"
            >

              <div class="h-12 w-12 rounded-2xl bg-slate-100"></div>

              <div class="flex-1">

                <div class="h-4 w-48 rounded bg-slate-100"></div>

                <div class="mt-2 h-3 w-24 rounded bg-slate-100"></div>

              </div>

              <div class="h-4 w-24 rounded bg-slate-100"></div>

              <div class="h-4 w-28 rounded bg-slate-100"></div>

              <div class="h-8 w-24 rounded-full bg-slate-100"></div>

            </div>

          </div>

          <div class="py-12 text-center md:hidden">

            <div
              class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"
            ></div>

            <p class="mt-4 text-sm font-semibold text-slate-400">
              Loading inventory...
            </p>

          </div>

        </div>

        <!-- Empty -->

        <div
          v-else-if="products.length === 0"
          class="px-6 py-24 text-center"
        >

          <div
            class="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-3xl text-slate-400"
          >
            ◫
          </div>

          <h3 class="mt-6 text-xl font-black text-slate-800">
            No products found
          </h3>

          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
            No products match your current search criteria.
            Try adjusting your filters or add a new product.
          </p>

          <div class="mt-6 flex justify-center gap-3">

            <button
              @click="clearFilters"
              class="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Clear filters
            </button>

            <button
              @click="openAddModal"
              class="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              + Add Product
            </button>

          </div>

        </div>

        <!-- Desktop Table -->

        <div
          v-else
          class="overflow-x-auto"
        >

          <table class="w-full min-w-[1100px]">

            <thead>

              <tr class="bg-slate-50/80">

                <th class="px-7 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Product
                </th>

                <th class="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Category
                </th>

                <th class="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Price
                </th>

                <th class="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Stock Health
                </th>

                <th class="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </th>

                <th class="px-7 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              <tr
                v-for="product in products"
                :key="product.productId"
                class="group border-t border-slate-100 transition duration-200 hover:bg-indigo-50/30"
              >

                <!-- Product -->

                <td class="px-7 py-5">

                  <div class="flex items-center gap-4">

                    <div
                      class="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black text-white shadow-lg shadow-indigo-100"
                    >

                      {{ getInitials(product.productName) }}

                      <span
                        class="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white"
                        :class="
                          product.status === 'AVAILABLE'
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        "
                      ></span>

                    </div>

                    <div>

                      <p class="font-black text-slate-800">
                        {{ product.productName }}
                      </p>

                      <div class="mt-1 flex items-center gap-2">

                        <span class="font-mono text-[10px] font-bold text-slate-400">
                          SKU #{{ product.productId }}
                        </span>

                        <span class="h-1 w-1 rounded-full bg-slate-300"></span>

                        <span class="text-[10px] font-semibold text-slate-400">
                          Inventory item
                        </span>

                      </div>

                    </div>

                  </div>

                </td>

                <!-- Category -->

                <td class="px-5 py-5">

                  <span
                    class="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm"
                  >
                    {{ product.category }}
                  </span>

                </td>

                <!-- Price -->

                <td class="px-5 py-5">

                  <div>

                    <p class="text-sm font-black text-slate-800">
                      ₹{{ Number(product.productPrice).toLocaleString('en-IN') }}
                    </p>

                    <p class="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Unit price
                    </p>

                  </div>

                </td>

                <!-- Stock -->

                <td class="px-5 py-5">

                  <div class="w-48">

                    <div class="mb-2 flex items-center justify-between">

                      <div class="flex items-center gap-2">

                        <span class="text-sm font-black text-slate-800">
                          {{ product.remainingStock }}
                        </span>

                        <span class="text-xs font-medium text-slate-400">
                          / {{ product.totalStock }}
                        </span>

                      </div>

                      <span
                        class="text-[10px] font-black uppercase tracking-wide"
                        :class="
                          product.remainingStock === 0
                            ? 'text-rose-500'
                            : product.remainingStock <= product.totalStock * 0.25
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                        "
                      >
                        {{ getStockLabel(product) }}
                      </span>

                    </div>

                    <div class="h-2 overflow-hidden rounded-full bg-slate-100">

                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :class="
                          product.remainingStock === 0
                            ? 'bg-rose-500'
                            : product.remainingStock <= product.totalStock * 0.25
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        "
                        :style="{
                          width: `${getStockPercentage(product)}%`
                        }"
                      ></div>

                    </div>

                    <div class="mt-1.5 flex justify-between">

                      <span class="text-[10px] text-slate-400">
                        Remaining
                      </span>

                      <span class="text-[10px] font-bold text-slate-500">
                        {{ Math.round(getStockPercentage(product)) }}%
                      </span>

                    </div>

                  </div>

                </td>

                <!-- Status -->

                <td class="px-5 py-5">

                  <span
                    v-if="product.status === 'AVAILABLE'"
                    class="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700"
                  >

                    <span class="relative flex h-2 w-2">

                      <span
                        class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50"
                      ></span>

                      <span
                        class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"
                      ></span>

                    </span>

                    Available

                  </span>

                  <span
                    v-else
                    class="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-[11px] font-black text-rose-700"
                  >

                    <span class="h-2 w-2 rounded-full bg-rose-500"></span>

                    {{ product.status }}

                  </span>

                </td>

                <!-- Actions -->

                <td class="px-7 py-5">

                  <div class="flex justify-end gap-2 opacity-80 transition group-hover:opacity-100">

                    <button
                      @click="openEditModal(product)"
                      class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Edit
                    </button>

                    <button
                      @click="openDeleteModal(product)"
                      class="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-600 transition hover:bg-rose-100"
                    >
                      Delete
                    </button>

                  </div>

                </td>

              </tr>

            </tbody>

          </table>

        </div>

        <!-- ================================================= -->
        <!-- PAGINATION -->
        <!-- ================================================= -->

        <div
          v-if="totalPages > 0"
          class="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-7"
        >

          <div>

            <p class="text-xs font-semibold text-slate-400">

              Showing

              <span class="font-black text-slate-700">
                {{ products.length }}
              </span>

              of

              <span class="font-black text-slate-700">
                {{ totalElements }}
              </span>

              products

            </p>

          </div>

          <div class="flex items-center gap-2">

            <button
              @click="previousPage"
              :disabled="currentPage === 0 || loading"
              class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ←
              Previous
            </button>

            <div
              class="flex h-10 min-w-10 items-center justify-center rounded-xl bg-slate-950 px-3 text-xs font-black text-white"
            >
              {{ currentPage + 1 }}
            </div>

            <button
              @click="nextPage"
              :disabled="currentPage >= totalPages - 1 || loading"
              class="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              →
            </button>

          </div>

        </div>

      </section>

    </main>

    <!-- ================================================= -->
    <!-- ADD PRODUCT MODAL -->
    <!-- ================================================= -->

    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md"
      @click.self="closeAddModal"
    >

      <div
        class="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl"
      >

        <!-- Header -->

        <div class="relative overflow-hidden bg-slate-950 px-7 py-7 text-white">

          <div
            class="absolute -right-10 -top-20 h-56 w-56 rounded-full bg-indigo-600/30 blur-3xl"
          ></div>

          <div class="relative flex items-start justify-between">

            <div>

              <div class="mb-3 inline-flex rounded-xl bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                New inventory item
              </div>

              <h2 class="text-2xl font-black">
                Add Product
              </h2>

              <p class="mt-1.5 text-sm text-slate-400">
                Create a new product in your catalogue.
              </p>

            </div>

            <button
              @click="closeAddModal"
              :disabled="addingProduct"
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl transition hover:bg-white/20 disabled:opacity-40"
            >
              ×
            </button>

          </div>

        </div>

        <!-- Body -->

        <div class="p-7">

          <div
            v-if="addError"
            class="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600"
          >
            {{ addError }}
          </div>

          <div class="space-y-5">

            <div>

              <label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Product Name
              </label>

              <input
                v-model="newProduct.productName"
                type="text"
                placeholder="e.g. MacBook Pro 16"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />

            </div>

            <div class="grid grid-cols-2 gap-4">

              <div>

                <label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Price
                </label>

                <div class="relative">

                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ₹
                  </span>

                  <input
                    v-model="newProduct.productPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="69999"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-9 pr-4 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />

                </div>

              </div>

              <div>

                <label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Initial Stock
                </label>

                <input
                  v-model="newProduct.totalStock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="10"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />

              </div>

            </div>

            <div>

              <label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Category
              </label>

              <input
                v-model="newProduct.category"
                type="text"
                placeholder="e.g. Electronics"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />

            </div>

          </div>

          <div class="mt-7 flex justify-end gap-3">

            <button
              @click="closeAddModal"
              :disabled="addingProduct"
              class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              @click="addProduct"
              :disabled="addingProduct"
              class="rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ addingProduct ? 'Creating...' : 'Create Product' }}
            </button>

          </div>

        </div>

      </div>

    </div>

    <!-- ================================================= -->
    <!-- BULK MODAL -->
    <!-- ================================================= -->

    <div
      v-if="showBulkModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-md"
      @click.self="closeBulkModal"
    >

      <div
        class="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
      >

        <!-- Header -->

        <div class="relative shrink-0 overflow-hidden bg-slate-950 px-7 py-7 text-white">

          <div
            class="absolute right-0 top-0 h-60 w-60 rounded-full bg-indigo-600/20 blur-3xl"
          ></div>

          <div class="relative flex items-start justify-between">

            <div>

              <div class="mb-3 inline-flex rounded-xl bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                Batch operation
              </div>

              <h2 class="text-2xl font-black">
                Bulk Add Products
              </h2>

              <p class="mt-1.5 text-sm text-slate-400">
                Create multiple inventory products in one operation.
              </p>

            </div>

            <button
              @click="closeBulkModal"
              :disabled="addingBulkProducts"
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl transition hover:bg-white/20 disabled:opacity-40"
            >
              ×
            </button>

          </div>

        </div>

        <!-- Body -->

        <div class="overflow-y-auto p-7">

          <div
            v-if="bulkError"
            class="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600"
          >
            {{ bulkError }}
          </div>

          <div class="mb-3 hidden grid-cols-[45px_1.6fr_1fr_1fr_1fr_50px] gap-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 md:grid">

            <div>#</div>
            <div>Product</div>
            <div>Price</div>
            <div>Category</div>
            <div>Stock</div>
            <div></div>

          </div>

          <div class="space-y-3">

            <div
              v-for="(product, index) in bulkProducts"
              :key="index"
              class="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[45px_1.6fr_1fr_1fr_1fr_50px] md:items-center md:border-0 md:bg-transparent md:p-2"
            >

              <div class="hidden text-xs font-black text-slate-400 md:block">
                {{ String(index + 1).padStart(2, '0') }}
              </div>

              <div>

                <label class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400 md:hidden">
                  Product
                </label>

                <input
                  v-model="product.productName"
                  type="text"
                  placeholder="Product name"
                  :disabled="addingBulkProducts"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />

              </div>

              <div>

                <label class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400 md:hidden">
                  Price
                </label>

                <input
                  v-model="product.productPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  :disabled="addingBulkProducts"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />

              </div>

              <div>

                <label class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400 md:hidden">
                  Category
                </label>

                <input
                  v-model="product.category"
                  type="text"
                  placeholder="Category"
                  :disabled="addingBulkProducts"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />

              </div>

              <div>

                <label class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400 md:hidden">
                  Stock
                </label>

                <input
                  v-model="product.totalStock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Stock"
                  :disabled="addingBulkProducts"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />

              </div>

              <div class="flex justify-end">

                <button
                  @click="removeBulkRow(index)"
                  :disabled="addingBulkProducts || bulkProducts.length === 1"
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-lg font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ×
                </button>

              </div>

            </div>

          </div>

          <button
            @click="addBulkRow"
            :disabled="addingBulkProducts"
            class="mt-5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-5 py-3 text-xs font-black text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50"
          >
            + Add another product
          </button>

        </div>

        <!-- Footer -->

        <div class="shrink-0 border-t border-slate-100 bg-white px-7 py-5">

          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div class="text-sm text-slate-400">

              <span class="font-black text-slate-800">
                {{ bulkProducts.length }}
              </span>

              product{{ bulkProducts.length !== 1 ? 's' : '' }}
              in this batch

            </div>

            <div class="flex gap-3">

              <button
                @click="closeBulkModal"
                :disabled="addingBulkProducts"
                class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                @click="addBulkProducts"
                :disabled="addingBulkProducts"
                class="rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {{
                  addingBulkProducts
                    ? 'Creating...'
                    : `Create ${bulkProducts.length} Product${bulkProducts.length !== 1 ? 's' : ''}`
                }}
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

    <!-- ================================================= -->
    <!-- EDIT MODAL -->
    <!-- ================================================= -->

    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md"
      @click.self="closeEditModal"
    >

      <div
        class="w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
      >

        <div class="relative overflow-hidden bg-slate-950 px-7 py-7 text-white">

          <div
            class="absolute right-0 top-0 h-52 w-52 rounded-full bg-indigo-600/20 blur-3xl"
          ></div>

          <div class="relative flex items-start justify-between">

            <div>

              <div class="mb-3 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                Product #{{ editProductData.productId }}
              </div>

              <h2 class="text-2xl font-black">
                Edit Product
              </h2>

              <p class="mt-1.5 text-sm text-slate-400">
                Update product information.
              </p>

            </div>

            <button
              @click="closeEditModal"
              :disabled="editingProduct"
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl transition hover:bg-white/20"
            >
              ×
            </button>

          </div>

        </div>

        <div class="p-7">

          <div
            v-if="editError"
            class="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600"
          >
            {{ editError }}
          </div>

          <div class="mb-5 rounded-2xl bg-slate-50 p-4">

            <div class="flex items-center gap-3">

              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-700"
              >
                {{ getInitials(editProductData.productName) }}
              </div>

              <div>

                <p class="text-sm font-black text-slate-800">
                  {{ editProductData.productName || 'Product' }}
                </p>

                <p class="mt-0.5 text-xs text-slate-400">
                  Inventory product #{{ editProductData.productId }}
                </p>

              </div>

            </div>

          </div>

          <div class="space-y-5">

            <div>

              <label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Product Name
              </label>

              <input
                v-model="editProductData.productName"
                type="text"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />

            </div>

            <div class="grid grid-cols-2 gap-4">

              <div>

                <label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Price
                </label>

                <input
                  v-model="editProductData.productPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />

              </div>

              <div>

                <label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Total Stock
                </label>

                <input
                  v-model="editProductData.totalStock"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />

              </div>

            </div>

            <div>

              <label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Category
              </label>

              <input
                v-model="editProductData.category"
                type="text"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />

            </div>

          </div>

          <div class="mt-5 rounded-xl bg-indigo-50 px-4 py-3 text-xs font-medium text-indigo-600">
            Remaining stock is managed automatically by inventory operations.
          </div>

          <div class="mt-7 flex justify-end gap-3">

            <button
              @click="closeEditModal"
              :disabled="editingProduct"
              class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              @click="updateProduct"
              :disabled="editingProduct"
              class="rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ editingProduct ? 'Saving...' : 'Save Changes' }}
            </button>

          </div>

        </div>

      </div>

    </div>

    <!-- ================================================= -->
    <!-- DELETE MODAL -->
    <!-- ================================================= -->

    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md"
      @click.self="closeDeleteModal"
    >

      <div
        class="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl"
      >

        <div class="p-7">

          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-xl font-black text-rose-600"
          >
            !
          </div>

          <h2 class="mt-6 text-2xl font-black text-slate-900">
            Delete product?
          </h2>

          <p class="mt-2 text-sm leading-6 text-slate-500">
            You are about to deactivate
            <span class="font-black text-slate-800">
              {{ productToDelete?.productName }}
            </span>.
          </p>

          <div class="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">

            <div class="flex gap-3">

              <span class="text-amber-600">
                ⚠
              </span>

              <p class="text-xs font-semibold leading-5 text-amber-700">
                This product will no longer appear as an active
                product in the inventory catalogue.
              </p>

            </div>

          </div>

          <div
            v-if="deleteError"
            class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600"
          >
            {{ deleteError }}
          </div>

          <div class="mt-7 flex justify-end gap-3">

            <button
              @click="closeDeleteModal"
              :disabled="deletingProduct"
              class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              @click="deleteProduct"
              :disabled="deletingProduct"
              class="rounded-xl bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-100 transition hover:bg-rose-700 disabled:opacity-50"
            >
              {{ deletingProduct ? 'Deleting...' : 'Yes, Delete' }}
            </button>

          </div>

        </div>

      </div>

    </div>

  </div>

</template>