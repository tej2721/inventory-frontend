
<script setup>
import { onMounted, ref, computed } from 'vue'

const products = ref([])
const loading = ref(true)
const error = ref('')

// =========================================================
// FETCH PRODUCTS
// =========================================================

const fetchProducts = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(
      'http://localhost:8080/api/products?page=0&size=10&sortBy=productId&sortDirection=desc'
    )

    if (!response.ok) {
      throw new Error('Failed to load dashboard data')
    }

    const result = await response.json()

    products.value = result.data.content || []
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// =========================================================
// DASHBOARD STATISTICS
// =========================================================

const totalProducts = computed(() => products.value.length)

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

const totalStock = computed(() => {
  return products.value.reduce(
    (sum, product) => sum + Number(product.totalStock || 0),
    0
  )
})

const remainingStock = computed(() => {
  return products.value.reduce(
    (sum, product) => sum + Number(product.remainingStock || 0),
    0
  )
})

const lowStockProducts = computed(() => {
  return products.value.filter(product => {
    const total = Number(product.totalStock || 0)
    const remaining = Number(product.remainingStock || 0)

    if (total === 0) return false

    return remaining > 0 && remaining <= total * 0.25
  })
})

// =========================================================
// STOCK UTILIZATION
// =========================================================

const stockUtilization = computed(() => {
  if (!totalStock.value) return 0

  const usedStock = totalStock.value - remainingStock.value

  return Math.round(
    (usedStock / totalStock.value) * 100
  )
})

// =========================================================
// STOCK CIRCLE STYLE
// =========================================================

const stockCircleStyle = computed(() => {
  const degrees = stockUtilization.value * 3.6

  return {
    background: `conic-gradient(
      #4f46e5 0deg ${degrees}deg,
      #e0e7ff ${degrees}deg 360deg
    )`
  }
})

// =========================================================
// RECENT PRODUCTS
// =========================================================

const recentProducts = computed(() => {
  return [...products.value]
    .sort((a, b) => b.productId - a.productId)
    .slice(0, 5)
})

// =========================================================
// HELPERS
// =========================================================

const formatPrice = price => {
  return Number(price || 0).toLocaleString('en-IN')
}

const getStockPercentage = product => {
  const total = Number(product.totalStock || 0)

  if (!total) return 0

  return Math.min(
    Math.round(
      (Number(product.remainingStock || 0) / total) * 100
    ),
    100
  )
}

const getStockColor = product => {
  const percentage = getStockPercentage(product)

  if (percentage === 0) return 'bg-rose-500'

  if (percentage <= 25) return 'bg-amber-500'

  return 'bg-emerald-500'
}

const getInitial = name => {
  return name?.charAt(0)?.toUpperCase() || 'P'
}

// =========================================================
// INITIAL LOAD
// =========================================================

onMounted(() => {
  fetchProducts()
})
</script>

<template>
  <div class="min-h-screen bg-[#f6f8fc]">

    <!-- ================================================= -->
    <!-- PAGE HEADER -->
    <!-- ================================================= -->

    <section
      class="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-900 px-6 py-10 text-white lg:px-10"
    >

      <div
        class="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
      ></div>

      <div
        class="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl"
      ></div>

      <div class="relative mx-auto max-w-[1600px]">

        <div
          class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
        >

          <div>

            <div
              class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-indigo-100 backdrop-blur"
            >

              <span
                class="h-2 w-2 rounded-full bg-emerald-400"
              ></span>

              INVENTORY MANAGEMENT SYSTEM

            </div>

            <h1
              class="text-4xl font-black tracking-tight sm:text-5xl"
            >
              Welcome back 👋
            </h1>

            <p
              class="mt-3 max-w-2xl text-base leading-7 text-indigo-200"
            >
              Here's a quick overview of your inventory,
              products and stock health.
            </p>

          </div>

          <!-- System status -->

          <div
            class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur"
          >

            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10"
            >

              <span
                class="h-2.5 w-2.5 rounded-full bg-emerald-400"
              ></span>

            </div>

            <div>

              <p class="text-xs text-indigo-300">
                SYSTEM STATUS
              </p>

              <p class="mt-1 text-sm font-bold text-white">
                All systems operational
              </p>

            </div>

          </div>

        </div>

      </div>

    </section>

    <!-- ================================================= -->
    <!-- MAIN CONTENT -->
    <!-- ================================================= -->

    <main class="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">

      <!-- ================================================= -->
      <!-- ERROR -->
      <!-- ================================================= -->

      <div
        v-if="error"
        class="mb-7 rounded-2xl border border-rose-200 bg-rose-50 p-5"
      >

        <div class="flex items-center gap-3">

          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 font-bold text-rose-600"
          >
            !
          </div>

          <div>

            <p class="font-bold text-rose-800">
              Dashboard unavailable
            </p>

            <p class="mt-1 text-sm text-rose-600">
              {{ error }}
            </p>

          </div>

        </div>

      </div>

      <!-- ================================================= -->
      <!-- KPI CARDS -->
      <!-- ================================================= -->

      <section
        class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
      >

        <!-- Total Products -->

        <div
          class="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >

          <div class="flex items-start justify-between">

            <div>

              <p class="text-sm font-semibold text-slate-500">
                Total Products
              </p>

              <p class="mt-3 text-4xl font-black text-slate-900">
                {{ loading ? '—' : totalProducts }}
              </p>

            </div>

            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-600 transition group-hover:scale-110"
            >
              📦
            </div>

          </div>

          <div class="mt-5 flex items-center gap-2">

            <span
              class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600"
            >
              Catalogue
            </span>

            <span class="text-xs text-slate-400">
              Active inventory
            </span>

          </div>

        </div>

        <!-- Total Stock -->

        <div
          class="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >

          <div class="flex items-start justify-between">

            <div>

              <p class="text-sm font-semibold text-slate-500">
                Total Stock
              </p>

              <p class="mt-3 text-4xl font-black text-slate-900">
                {{ loading ? '—' : totalStock }}
              </p>

            </div>

            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-xl text-violet-600 transition group-hover:scale-110"
            >
              ◫
            </div>

          </div>

          <div class="mt-5">

            <div class="mb-2 flex justify-between text-xs">

              <span class="font-semibold text-slate-500">
                Stock utilization
              </span>

              <span class="font-bold text-violet-600">
                {{ stockUtilization }}%
              </span>

            </div>

            <div
              class="h-2 overflow-hidden rounded-full bg-slate-100"
            >

              <div
                class="h-full rounded-full bg-violet-500 transition-all duration-700"
                :style="{ width: `${stockUtilization}%` }"
              ></div>

            </div>

          </div>

        </div>

        <!-- Available -->

        <div
          class="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >

          <div class="flex items-start justify-between">

            <div>

              <p class="text-sm font-semibold text-slate-500">
                Available
              </p>

              <p
                class="mt-3 text-4xl font-black text-emerald-600"
              >
                {{ loading ? '—' : availableProducts }}
              </p>

            </div>

            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-600 transition group-hover:scale-110"
            >
              ✓
            </div>

          </div>

          <div class="mt-5 flex items-center gap-2">

            <span
              class="h-2 w-2 rounded-full bg-emerald-500"
            ></span>

            <span
              class="text-xs font-semibold text-slate-500"
            >
              Products ready for sale
            </span>

          </div>

        </div>

        <!-- Out of Stock -->

        <div
          class="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >

          <div class="flex items-start justify-between">

            <div>

              <p class="text-sm font-semibold text-slate-500">
                Out of Stock
              </p>

              <p
                class="mt-3 text-4xl font-black text-rose-600"
              >
                {{ loading ? '—' : outOfStockProducts }}
              </p>

            </div>

            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-xl text-rose-600 transition group-hover:scale-110"
            >
              !
            </div>

          </div>

          <div class="mt-5 flex items-center gap-2">

            <span
              class="h-2 w-2 rounded-full bg-rose-500"
            ></span>

            <span
              class="text-xs font-semibold text-slate-500"
            >
              Requires attention
            </span>

          </div>

        </div>

      </section>

      <!-- ================================================= -->
      <!-- SECOND ROW -->
      <!-- ================================================= -->

      <section
        class="mt-7 grid grid-cols-1 gap-7 xl:grid-cols-3"
      >

        <!-- ================================================= -->
        <!-- QUICK ACTIONS -->
        <!-- ================================================= -->

        <div
          class="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
        >

          <div class="mb-6">

            <p
              class="text-xs font-bold uppercase tracking-widest text-indigo-500"
            >
              Shortcuts
            </p>

            <h2
              class="mt-2 text-xl font-black text-slate-900"
            >
              Quick Actions
            </h2>

            <p class="mt-1 text-sm text-slate-400">
              Manage your inventory faster.
            </p>

          </div>

          <div class="space-y-3">

            <!-- Add Product -->

            <a
              href="/products"
              class="group flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-indigo-100 hover:bg-indigo-50"
            >

              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white"
              >
                +
              </div>

              <div class="flex-1">

                <p class="text-sm font-bold text-slate-800">
                  Add Product
                </p>

                <p class="mt-1 text-xs text-slate-400">
                  Create a new inventory item
                </p>

              </div>

              <span
                class="text-slate-300 transition group-hover:text-indigo-500"
              >
                →
              </span>

            </a>

            <!-- Bulk Add -->

            <a
              href="/products"
              class="group flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-violet-100 hover:bg-violet-50"
            >

              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white"
              >
                ▦
              </div>

              <div class="flex-1">

                <p class="text-sm font-bold text-slate-800">
                  Bulk Add
                </p>

                <p class="mt-1 text-xs text-slate-400">
                  Add multiple products at once
                </p>

              </div>

              <span
                class="text-slate-300 transition group-hover:text-violet-500"
              >
                →
              </span>

            </a>

            <!-- View Orders -->

            <a
              href="/orders"
              class="group flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-100 hover:bg-emerald-50"
            >

              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white"
              >
                🛒
              </div>

              <div class="flex-1">

                <p class="text-sm font-bold text-slate-800">
                  View Orders
                </p>

                <p class="mt-1 text-xs text-slate-400">
                  Review recent transactions
                </p>

              </div>

              <span
                class="text-slate-300 transition group-hover:text-emerald-500"
              >
                →
              </span>

            </a>

          </div>

        </div>

        <!-- ================================================= -->
        <!-- INVENTORY HEALTH -->
        <!-- ================================================= -->

        <div
          class="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
        >

          <div class="mb-7">

            <p
              class="text-xs font-bold uppercase tracking-widest text-indigo-500"
            >
              Inventory Health
            </p>

            <h2
              class="mt-2 text-xl font-black text-slate-900"
            >
              Stock Overview
            </h2>

          </div>

          <!-- Main percentage -->

          <div class="flex items-center gap-6">

            <!-- FIXED CIRCULAR PROGRESS -->

            <div
              class="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
              :style="stockCircleStyle"
            >

              <!-- Inner white circle -->

              <div
                class="flex h-24 w-24 items-center justify-center rounded-full bg-white"
              >

                <div class="text-center">

                  <p
                    class="text-3xl font-black text-slate-900"
                  >
                    {{ stockUtilization }}%
                  </p>

                  <p
                    class="text-[10px] font-bold uppercase tracking-wide text-slate-400"
                  >
                    Used
                  </p>

                </div>

              </div>

            </div>

            <!-- Stock details -->

            <div class="flex-1 space-y-5">

              <!-- Remaining -->

              <div>

                <div class="flex justify-between">

                  <span
                    class="text-sm font-semibold text-slate-600"
                  >
                    Remaining
                  </span>

                  <span
                    class="text-sm font-black text-slate-900"
                  >
                    {{ remainingStock }}
                  </span>

                </div>

                <div
                  class="mt-2 h-2 rounded-full bg-slate-100"
                >

                  <div
                    class="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    :style="{
                      width:
                        totalStock > 0
                          ? `${Math.min(
                              (remainingStock / totalStock) * 100,
                              100
                            )}%`
                          : '0%'
                    }"
                  ></div>

                </div>

              </div>

              <!-- Low Stock -->

              <div>

                <div class="flex justify-between">

                  <span
                    class="text-sm font-semibold text-slate-600"
                  >
                    Low Stock
                  </span>

                  <span
                    class="text-sm font-black text-amber-600"
                  >
                    {{ lowStockProducts.length }}
                  </span>

                </div>

              </div>

              <!-- Out of Stock -->

              <div>

                <div class="flex justify-between">

                  <span
                    class="text-sm font-semibold text-slate-600"
                  >
                    Out of Stock
                  </span>

                  <span
                    class="text-sm font-black text-rose-600"
                  >
                    {{ outOfStockProducts }}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

        <!-- ================================================= -->
        <!-- STOCK ALERTS -->
        <!-- ================================================= -->

        <div
          class="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
        >

          <div
            class="mb-6 flex items-start justify-between"
          >

            <div>

              <p
                class="text-xs font-bold uppercase tracking-widest text-amber-500"
              >
                Attention
              </p>

              <h2
                class="mt-2 text-xl font-black text-slate-900"
              >
                Stock Alerts
              </h2>

            </div>

            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
            >
              !
            </div>

          </div>

          <!-- No alerts -->

          <div
            v-if="lowStockProducts.length === 0"
            class="rounded-2xl bg-emerald-50 p-5"
          >

            <div class="flex items-center gap-3">

              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"
              >
                ✓
              </div>

              <div>

                <p
                  class="text-sm font-bold text-emerald-800"
                >
                  Inventory looks healthy
                </p>

                <p
                  class="mt-1 text-xs text-emerald-600"
                >
                  No products require immediate restocking.
                </p>

              </div>

            </div>

          </div>

          <!-- Low stock products -->

          <div
            v-else
            class="space-y-3"
          >

            <div
              v-for="product in lowStockProducts.slice(0, 4)"
              :key="product.productId"
              class="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"
            >

              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 font-bold text-amber-600"
              >
                {{ getInitial(product.productName) }}
              </div>

              <div class="min-w-0 flex-1">

                <p
                  class="truncate text-sm font-bold text-slate-800"
                >
                  {{ product.productName }}
                </p>

                <p
                  class="mt-1 text-xs text-slate-400"
                >
                  Only {{ product.remainingStock }} left
                </p>

              </div>

              <span
                class="text-xs font-bold text-amber-600"
              >
                Low
              </span>

            </div>

          </div>

        </div>

      </section>

      <!-- ================================================= -->
      <!-- RECENT PRODUCTS -->
      <!-- ================================================= -->

      <section
        class="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >

        <div
          class="flex flex-col gap-4 border-b border-slate-100 px-7 py-6 sm:flex-row sm:items-center sm:justify-between"
        >

          <div>

            <p
              class="text-xs font-bold uppercase tracking-widest text-indigo-500"
            >
              Catalogue
            </p>

            <h2
              class="mt-2 text-xl font-black text-slate-900"
            >
              Recent Products
            </h2>

            <p class="mt-1 text-sm text-slate-400">
              Latest products added to your inventory.
            </p>

          </div>

          <a
            href="/products"
            class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            View All Products

            <span class="ml-2">
              →
            </span>

          </a>

        </div>

        <!-- Loading -->

        <div
          v-if="loading"
          class="px-7 py-16 text-center"
        >

          <div
            class="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"
          ></div>

          <p
            class="mt-4 text-sm font-medium text-slate-400"
          >
            Loading inventory...
          </p>

        </div>

        <!-- Products -->

        <div
          v-else
          class="overflow-x-auto"
        >

          <table class="w-full min-w-[800px]">

            <thead>

              <tr class="bg-slate-50 text-left">

                <th
                  class="px-7 py-4 text-xs font-bold uppercase tracking-wide text-slate-400"
                >
                  Product
                </th>

                <th
                  class="px-7 py-4 text-xs font-bold uppercase tracking-wide text-slate-400"
                >
                  Category
                </th>

                <th
                  class="px-7 py-4 text-xs font-bold uppercase tracking-wide text-slate-400"
                >
                  Price
                </th>

                <th
                  class="px-7 py-4 text-xs font-bold uppercase tracking-wide text-slate-400"
                >
                  Stock
                </th>

                <th
                  class="px-7 py-4 text-xs font-bold uppercase tracking-wide text-slate-400"
                >
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              <tr
                v-for="product in recentProducts"
                :key="product.productId"
                class="border-t border-slate-100 transition hover:bg-indigo-50/30"
              >

                <!-- Product -->

                <td class="px-7 py-5">

                  <div class="flex items-center gap-4">

                    <div
                      class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 font-black text-indigo-700"
                    >
                      {{ getInitial(product.productName) }}
                    </div>

                    <div>

                      <p
                        class="font-bold text-slate-800"
                      >
                        {{ product.productName }}
                      </p>

                      <p
                        class="mt-1 text-xs text-slate-400"
                      >
                        #{{ product.productId }}
                      </p>

                    </div>

                  </div>

                </td>

                <!-- Category -->

                <td class="px-7 py-5">

                  <span
                    class="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"
                  >
                    {{ product.category }}
                  </span>

                </td>

                <!-- Price -->

                <td class="px-7 py-5">

                  <span
                    class="font-bold text-slate-800"
                  >
                    ₹{{ formatPrice(product.productPrice) }}
                  </span>

                </td>

                <!-- Stock -->

                <td class="px-7 py-5">

                  <div class="w-36">

                    <div
                      class="mb-2 flex justify-between"
                    >

                      <span
                        class="text-xs font-bold text-slate-700"
                      >
                        {{ product.remainingStock }}
                      </span>

                      <span
                        class="text-xs text-slate-400"
                      >
                        / {{ product.totalStock }}
                      </span>

                    </div>

                    <div
                      class="h-1.5 overflow-hidden rounded-full bg-slate-100"
                    >

                      <div
                        :class="getStockColor(product)"
                        class="h-full rounded-full transition-all"
                        :style="{
                          width: `${getStockPercentage(product)}%`
                        }"
                      ></div>

                    </div>

                  </div>

                </td>

                <!-- Status -->

                <td class="px-7 py-5">

                  <span
                    v-if="product.status === 'AVAILABLE'"
                    class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
                  >

                    <span
                      class="h-1.5 w-1.5 rounded-full bg-emerald-500"
                    ></span>

                    Available

                  </span>

                  <span
                    v-else
                    class="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
                  >

                    <span
                      class="h-1.5 w-1.5 rounded-full bg-rose-500"
                    ></span>

                    {{ product.status }}

                  </span>

                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </section>

      <!-- ================================================= -->
      <!-- FOOTER -->
      <!-- ================================================= -->

      <div
        class="flex flex-col gap-2 py-8 text-center text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:text-left"
      >

        <p>
          Inventory Management System
        </p>

        <p>
          Product & Inventory Operations
        </p>

      </div>

    </main>

  </div>
</template>

