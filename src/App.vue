
<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navbar -->
    <header class="border-b bg-white shadow-sm">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white"
          >
            IM
          </div>

          <div>
            <h1 class="text-lg font-bold text-gray-800">
              Inventory Management
            </h1>

            <p class="text-xs text-gray-400">
              Manage products & orders
            </p>
          </div>
        </RouterLink>

        <!-- Navigation -->
        <nav class="flex items-center gap-2">
          <RouterLink
            to="/products"
            class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
            active-class="bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
          >
            Products
          </RouterLink>

          <RouterLink
            to="/orders"
            class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
            active-class="bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
          >
            Orders
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="mx-auto max-w-7xl px-6 py-8">
      <RouterView />
    </main>
  </div>
</template>

