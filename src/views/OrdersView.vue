<script setup>
import { computed, onMounted, ref } from 'vue'

const ORDER_API = 'http://localhost:8081/api/orders'

const orders = ref([])
const loading = ref(false)
const error = ref('')

const status = ref('')
const customerName = ref('')

const cancellingOrderId = ref(null)
const showCancelModal = ref(false)
const selectedOrder = ref(null)

const fetchOrders = async () => {
  loading.value = true
  error.value = ''

  try {
    let url = ORDER_API

    if (status.value || customerName.value) {
      const params = new URLSearchParams()

      if (status.value) {
        params.append('status', status.value)
      }

      if (customerName.value.trim()) {
        params.append(
          'customerName',
          customerName.value.trim(),
        )
      }

      url = `${ORDER_API}/filter?${params.toString()}`
    }

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Order API returned ${response.status} ${response.statusText}`,
      )
    }

    const result = await response.json()

    orders.value = Array.isArray(result)
      ? result
      : result.data || []
  } catch (err) {
    console.error('Order API Error:', err)

    error.value =
      'Unable to connect to Order Service. Please make sure the Order Service is running and the port is correct.'
  } finally {
    loading.value = false
  }
}

// =========================================================
// FILTERS
// =========================================================

const applyFilters = () => {
  fetchOrders()
}

const clearFilters = () => {
  status.value = ''
  customerName.value = ''
  fetchOrders()
}

// =========================================================
// ORDER STATISTICS
// =========================================================

const placedOrders = computed(() => {
  return orders.value.filter(
    (order) => order.status === 'PLACED',
  ).length
})

const completedOrders = computed(() => {
  return orders.value.filter(
    (order) => order.status === 'COMPLETED',
  ).length
})

const cancelledOrders = computed(() => {
  return orders.value.filter(
    (order) => order.status === 'CANCELLED',
  ).length
})

const totalOrderValue = computed(() => {
  return orders.value.reduce(
    (total, order) =>
      total + Number(order.totalAmount || 0),
    0,
  )
})

// =========================================================
// CANCEL ORDER
// =========================================================

const openCancelModal = (order) => {
  selectedOrder.value = order
  showCancelModal.value = true
}

const closeCancelModal = () => {
  if (cancellingOrderId.value) {
    return
  }

  showCancelModal.value = false
  selectedOrder.value = null
}

const cancelOrder = async () => {
  if (!selectedOrder.value) {
    return
  }

  const orderId = selectedOrder.value.id

  cancellingOrderId.value = orderId
  error.value = ''

  try {
    const response = await fetch(
      `${ORDER_API}/${orderId}/cancel`,
      {
        method: 'POST',
      },
    )

    const result = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(
        result?.message ||
          `Failed to cancel order: ${response.status}`,
      )
    }

    showCancelModal.value = false
    selectedOrder.value = null

    await fetchOrders()
  } catch (err) {
    console.error('Cancel order error:', err)

    error.value =
      err.message || 'Failed to cancel the order.'
  } finally {
    cancellingOrderId.value = null
  }
}

// =========================================================
// HELPERS
// =========================================================

const formatPrice = (price) => {
  if (price == null) {
    return '₹0'
  }

  return `₹${Number(price).toLocaleString('en-IN')}`
}

const formatDate = (date) => {
  if (!date) {
    return '-'
  }

  return new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const getStatusClass = (orderStatus) => {
  switch (orderStatus) {
    case 'PLACED':
      return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'

    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'

    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'

    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
  }
}

const getStatusLabel = (orderStatus) => {
  switch (orderStatus) {
    case 'PLACED':
      return 'Placed'

    case 'CANCELLED':
      return 'Cancelled'

    case 'COMPLETED':
      return 'Completed'

    default:
      return orderStatus || 'Unknown'
  }
}

const getStatusDotClass = (orderStatus) => {
  switch (orderStatus) {
    case 'PLACED':
      return 'bg-indigo-500'

    case 'CANCELLED':
      return 'bg-rose-500'

    case 'COMPLETED':
      return 'bg-emerald-500'

    default:
      return 'bg-slate-400'
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <div class="min-h-screen bg-[#f6f7fb] p-1">

    <!-- ================================================= -->
    <!-- PAGE HEADER -->
    <!-- ================================================= -->

    <div class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

      <div>
        <div class="mb-2 flex items-center gap-2 text-sm text-slate-400">
          <span>Workspace</span>
          <span>/</span>
          <span class="font-medium text-indigo-500">
            Orders
          </span>
        </div>

        <h1 class="text-3xl font-bold tracking-tight text-slate-900">
          Order Management
        </h1>

        <p class="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Keep track of customer purchases, payments and order
          status from one place.
        </p>
      </div>

      <div
        class="flex w-fit items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
              d="M3 7h18M5 7v12h14V7M8 7V5a4 4 0 018 0v2"
            />
          </svg>
        </div>

        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-slate-400">
            Total orders
          </p>

          <p class="text-xl font-bold text-slate-900">
            {{ orders.length }}
          </p>
        </div>
      </div>

    </div>

    <!-- ================================================= -->
    <!-- STAT CARDS -->
    <!-- ================================================= -->

    <div class="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

      <!-- Total -->
      <div
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between">

          <div>
            <p class="text-sm font-medium text-slate-500">
              Total Orders
            </p>

            <p class="mt-2 text-3xl font-bold text-slate-900">
              {{ orders.length }}
            </p>

            <p class="mt-2 text-xs text-slate-400">
              Orders in current view
            </p>
          </div>

          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M9 5h6M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
              />
            </svg>
          </div>

        </div>
      </div>

      <!-- Placed -->
      <div
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between">

          <div>
            <p class="text-sm font-medium text-slate-500">
              Active Orders
            </p>

            <p class="mt-2 text-3xl font-bold text-indigo-600">
              {{ placedOrders }}
            </p>

            <p class="mt-2 text-xs text-slate-400">
              Currently placed
            </p>
          </div>

          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"
          >
            <span class="h-3 w-3 rounded-full bg-indigo-500"></span>
          </div>

        </div>
      </div>

      <!-- Completed -->
      <div
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between">

          <div>
            <p class="text-sm font-medium text-slate-500">
              Completed
            </p>

            <p class="mt-2 text-3xl font-bold text-emerald-600">
              {{ completedOrders }}
            </p>

            <p class="mt-2 text-xs text-slate-400">
              Successfully completed
            </p>
          </div>

          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

        </div>
      </div>

      <!-- Revenue -->
      <div
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between">

          <div>
            <p class="text-sm font-medium text-slate-500">
              Order Value
            </p>

            <p class="mt-2 text-2xl font-bold text-slate-900">
              {{ formatPrice(totalOrderValue) }}
            </p>

            <p class="mt-2 text-xs text-slate-400">
              Current order total
            </p>
          </div>

          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-10v1m0 10v1m7-6a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

        </div>
      </div>

    </div>

    <!-- ================================================= -->
    <!-- FILTER PANEL -->
    <!-- ================================================= -->

    <div
      class="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >

      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 class="font-semibold text-slate-900">
            Find an order
          </h2>

          <p class="mt-1 text-xs text-slate-400">
            Filter orders by customer or current status.
          </p>
        </div>

        <button
          @click="clearFilters"
          class="w-fit rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Reset filters
        </button>

      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">

        <!-- Customer -->
        <div class="lg:col-span-1">

          <label
            class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Customer
          </label>

          <div class="relative">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M21 21l-4.35-4.35m2.1-5.4a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
              />
            </svg>

            <input
              v-model="customerName"
              type="text"
              placeholder="Search by customer name"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              @keyup.enter="applyFilters"
            />

          </div>

        </div>

        <!-- Status -->
        <div>

          <label
            class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Status
          </label>

          <select
            v-model="status"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
          >
            <option value="">
              All statuses
            </option>

            <option value="PLACED">
              Placed
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>

            <option value="COMPLETED">
              Completed
            </option>
          </select>

        </div>

        <!-- Button -->
        <div class="flex items-end">

          <button
            @click="applyFilters"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M3 4h18M6 10h12M10 16h4"
              />
            </svg>

            Apply Filters
          </button>

        </div>

      </div>

    </div>

    <!-- ================================================= -->
    <!-- LOADING -->
    <!-- ================================================= -->

    <div
      v-if="loading"
      class="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm"
    >

      <div class="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>

      <p class="font-medium text-slate-600">
        Loading orders
      </p>

      <p class="mt-1 text-sm text-slate-400">
        Fetching the latest order information...
      </p>

    </div>

    <!-- ================================================= -->
    <!-- ERROR -->
    <!-- ================================================= -->

    <div
      v-else-if="error"
      class="rounded-2xl border border-rose-200 bg-rose-50 p-6"
    >

      <div class="flex gap-4">

        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600"
        >
          !
        </div>

        <div>

          <h3 class="font-semibold text-rose-800">
            Something went wrong
          </h3>

          <p class="mt-1 text-sm leading-6 text-rose-600">
            {{ error }}
          </p>

          <button
            @click="fetchOrders"
            class="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Try Again
          </button>

        </div>

      </div>

    </div>

    <!-- ================================================= -->
    <!-- EMPTY -->
    <!-- ================================================= -->

    <div
      v-else-if="orders.length === 0"
      class="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm"
    >

      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.7"
            d="M9 5h6M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
          />
        </svg>
      </div>

      <h3 class="mt-5 text-lg font-semibold text-slate-700">
        No orders found
      </h3>

      <p class="mx-auto mt-2 max-w-sm text-sm text-slate-400">
        There are no orders matching your current filters.
        Try changing the customer name or status.
      </p>

      <button
        @click="clearFilters"
        class="mt-5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        Clear filters
      </button>

    </div>

    <!-- ================================================= -->
    <!-- ORDERS -->
    <!-- ================================================= -->

    <div
      v-else
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >

      <!-- Section Header -->
      <div
        class="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
      >

        <div>

          <div class="flex items-center gap-3">

            <h2 class="text-lg font-bold text-slate-900">
              Recent Orders
            </h2>

            <span
              class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600"
            >
              {{ orders.length }}
            </span>

          </div>

          <p class="mt-1 text-sm text-slate-400">
            Review customer purchases and order activity.
          </p>

        </div>

        <div class="flex items-center gap-2 text-xs text-slate-400">

          <span
            class="h-2 w-2 rounded-full bg-emerald-500"
          ></span>

          Live order data

        </div>

      </div>

      <!-- ================================================= -->
      <!-- TABLE -->
      <!-- ================================================= -->

      <div class="overflow-x-auto">

        <table class="w-full min-w-[1050px]">

          <thead>
            <tr class="border-b border-slate-100 bg-slate-50/70">

              <th
                class="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                Order
              </th>

              <th
                class="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                Customer
              </th>

              <th
                class="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                Items
              </th>

              <th
                class="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                Amount
              </th>

              <th
                class="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                Payment
              </th>

              <th
                class="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                Status
              </th>

              <th
                class="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                Date
              </th>

              <th
                class="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                Action
              </th>

            </tr>
          </thead>

          <tbody>

            <tr
              v-for="order in orders"
              :key="order.id"
              class="border-b border-slate-100 last:border-0 transition hover:bg-indigo-50/30"
            >

              <!-- Order -->
              <td class="px-6 py-5">

                <div class="flex items-center gap-3">

                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600"
                  >
                    #
                  </div>

                  <div>

                    <p class="font-bold text-slate-800">
                      #{{ order.id }}
                    </p>

                    <p class="mt-0.5 text-xs text-slate-400">
                      Order ID
                    </p>

                  </div>

                </div>

              </td>

              <!-- Customer -->
              <td class="px-6 py-5">

                <div class="flex items-center gap-3">

                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600"
                  >
                    {{
                      order.customerName
                        ? order.customerName
                            .charAt(0)
                            .toUpperCase()
                        : '?'
                    }}
                  </div>

                  <div>

                    <p class="font-semibold text-slate-800">
                      {{ order.customerName }}
                    </p>

                    <p class="text-xs text-slate-400">
                      Customer
                    </p>

                  </div>

                </div>

              </td>

              <!-- Items -->
              <td class="max-w-[240px] px-6 py-5">

                <div
                  v-if="order.items && order.items.length"
                  class="space-y-1.5"
                >

                  <div
                    v-for="(item, index) in order.items.slice(0, 2)"
                    :key="index"
                    class="flex items-center justify-between gap-3 text-sm"
                  >

                    <span class="truncate font-medium text-slate-600">
                      {{
                        item.productName ||
                        `Product ${item.productId}`
                      }}
                    </span>

                    <span
                      class="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500"
                    >
                      ×{{ item.quantity }}
                    </span>

                  </div>

                  <p
                    v-if="order.items.length > 2"
                    class="text-xs font-medium text-indigo-500"
                  >
                    +{{ order.items.length - 2 }} more item(s)
                  </p>

                </div>

                <span
                  v-else
                  class="text-sm text-slate-400"
                >
                  No items
                </span>

              </td>

              <!-- Amount -->
              <td class="px-6 py-5">

                <p class="font-bold text-slate-900">
                  {{ formatPrice(order.totalAmount) }}
                </p>

                <p class="mt-1 text-xs text-slate-400">
                  Total amount
                </p>

              </td>

              <!-- Payment -->
              <td class="px-6 py-5">

                <div
                  v-if="order.paymentInfo"
                  class="flex items-center gap-2"
                >

                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"
                  >
                    ₹
                  </div>

                  <div>

                    <p class="text-sm font-semibold text-slate-700">
                      {{
                        order.paymentInfo.paymentMethod ||
                        'Wallet'
                      }}
                    </p>

                    <p class="text-xs text-emerald-500">
                      Payment
                    </p>

                  </div>

                </div>

                <span
                  v-else
                  class="text-sm text-slate-400"
                >
                  Not available
                </span>

              </td>

              <!-- Status -->
              <td class="px-6 py-5">

                <span
                  class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
                  :class="getStatusClass(order.status)"
                >

                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="getStatusDotClass(order.status)"
                  ></span>

                  {{ getStatusLabel(order.status) }}

                </span>

              </td>

              <!-- Date -->
              <td class="px-6 py-5">

                <p class="text-sm font-medium text-slate-600">
                  {{ formatDate(order.createdAt) }}
                </p>

              </td>

              <!-- Action -->
              <td class="px-6 py-5 text-right">

                <button
                  v-if="order.status === 'PLACED'"
                  @click="openCancelModal(order)"
                  :disabled="cancellingOrderId === order.id"
                  class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{
                    cancellingOrderId === order.id
                      ? 'Cancelling...'
                      : 'Cancel'
                  }}
                </button>

                <span
                  v-else
                  class="text-xs font-medium text-slate-300"
                >
                  No action
                </span>

              </td>

            </tr>

          </tbody>

        </table>

      </div>

      <!-- Footer -->
      <div
        class="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
      >

        <p class="text-xs text-slate-400">
          Showing
          <span class="font-semibold text-slate-600">
            {{ orders.length }}
          </span>
          order(s)
        </p>

        <p class="text-xs text-slate-400">
          Order management
        </p>

      </div>

    </div>

    <!-- ================================================= -->
    <!-- CANCEL CONFIRMATION MODAL -->
    <!-- ================================================= -->

    <div
      v-if="showCancelModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
      @click.self="closeCancelModal"
    >

      <div
        class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >

        <!-- Icon -->
        <div
          class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
              d="M12 9v4m0 4h.01M10.29 3.86l-7.17 12a2 2 0 001.71 3h14.34a2 2 0 001.71-3l-7.17-12a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        <h2 class="text-xl font-bold text-slate-900">
          Cancel this order?
        </h2>

        <p class="mt-2 text-sm leading-6 text-slate-500">
          Are you sure you want to cancel order
          <span class="font-bold text-slate-700">
            #{{ selectedOrder?.id }}
          </span>?
          This action will restore the purchased stock.
        </p>

        <!-- Selected order -->
        <div
          v-if="selectedOrder"
          class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >

          <div class="flex items-center justify-between">

            <div>

              <p class="text-xs font-medium uppercase tracking-wide text-slate-400">
                Customer
              </p>

              <p class="mt-1 font-semibold text-slate-700">
                {{ selectedOrder.customerName }}
              </p>

            </div>

            <div class="text-right">

              <p class="text-xs font-medium uppercase tracking-wide text-slate-400">
                Amount
              </p>

              <p class="mt-1 font-bold text-slate-800">
                {{ formatPrice(selectedOrder.totalAmount) }}
              </p>

            </div>

          </div>

        </div>

        <!-- Buttons -->
        <div class="mt-6 flex justify-end gap-3">

          <button
            @click="closeCancelModal"
            :disabled="!!cancellingOrderId"
            class="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Keep Order
          </button>

          <button
            @click="cancelOrder"
            :disabled="!!cancellingOrderId"
            class="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{
              cancellingOrderId
                ? 'Cancelling...'
                : 'Yes, Cancel Order'
            }}
          </button>

        </div>

      </div>

    </div>

  </div>
</template>