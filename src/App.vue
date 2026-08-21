<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-gray-50">

    <!-- ================================================= -->
    <!-- NAVBAR -->
    <!-- ================================================= -->

    <header class="border-b bg-white shadow-sm">

      <div
        class="flex w-full items-center justify-between px-3 py-4 sm:px-5 lg:px-6"
      >

        <!-- ================================================= -->
        <!-- LEFT SIDE - LOGO + TITLE -->
        <!-- ================================================= -->

        <RouterLink
          to="/"
          class="flex items-center gap-3"
        >

          <!-- Logo -->

          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white"
          >
            IM
          </div>

          <!-- Application Name -->

          <div>

            <h1
              class="text-lg font-bold text-gray-800"
            >
              Inventory Management
            </h1>

            <p
              class="text-xs text-gray-400"
            >
              Manage products & orders
            </p>

          </div>

        </RouterLink>

        <!-- ================================================= -->
        <!-- RIGHT SIDE - NAVIGATION -->
        <!-- ================================================= -->

        <nav
          class="flex items-center gap-2"
        >

          <!-- Dashboard -->

          <RouterLink
            to="/"
            class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
            active-class="bg-blue-600 text-white"
          >
            Dashboard
          </RouterLink>

          <!-- Products -->

          <RouterLink
            to="/products"
            class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
            active-class="bg-blue-600 text-white"
          >
            Products
          </RouterLink>

          <!-- Orders -->

          <RouterLink
            to="/orders"
            class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
            active-class="bg-blue-600 text-white"
          >
            Orders
          </RouterLink>

        </nav>

      </div>

    </header>

    <!-- ================================================= -->
    <!-- PAGE CONTENT -->
    <!-- ================================================= -->

    <main>
      <RouterView />
    </main>

  </div>
</template>