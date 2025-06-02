<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

// This is a placeholder. In a real app, you'd get this from your auth state.
const isLoggedIn = ref(false)

const menuItems = computed(() => {
  const items = [
    { title: "Home", url: "/", icon: "i-heroicons-home" },
    { title: "Dashboard", url: "/dashboard", icon: "i-heroicons-chart-bar" },
  ]
  if (isLoggedIn.value) {
    items.push({
      title: "Logout",
      url: "/logout",
      icon: "i-heroicons-arrow-left-on-rectangle",
    })
  } else {
    items.push({
      title: "Login",
      url: "/login",
      icon: "i-heroicons-arrow-right-on-rectangle",
    })
  }
  return items
})
</script>

<template>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem
            v-for="item in menuItems"
            :key="item.title"
          >
            <SidebarMenuButton as-child>
              <NuxtLink
                :to="item.url"
                class="flex items-center"
              >
                <Icon
                  :name="item.icon"
                  class="w-5 h-5 mr-2"
                />
                <span>{{ item.title }}</span>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>
