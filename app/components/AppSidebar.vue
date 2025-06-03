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
import { computed } from "vue"
import { toast } from "vue-sonner"

type MenuItem = {
  title: string
  icon: string
  url?: string
  onClick?: () => Promise<void> | void
}

const menuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    { title: "Home", url: "/", icon: "i-heroicons-chart-bar" },
    { title: "Settings", url: "/settings", icon: "i-heroicons-cog-6-tooth" },
    {
      title: "Logout",
      onClick: async () => {
        const { error } = await authClient.signOut()
        if (error) {
          toast.error(error.message ?? "Failed to logout")
        } else {
          toast.success("Logged out")
        }
        await navigateTo("/login")
      },
      icon: "i-heroicons-arrow-left-on-rectangle",
    },
  ]
  return items
})
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Trader</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem
            v-for="item in menuItems"
            :key="item.title"
          >
            <SidebarMenuButton as-child>
              <NuxtLink
                v-if="item.url"
                :to="item.url"
                class="flex items-center w-full text-left p-2 hover:bg-muted rounded-md"
              >
                <Icon
                  :name="item.icon"
                  class="w-5 h-5 mr-2 flex-shrink-0"
                />
                <span class="truncate">{{ item.title }}</span>
              </NuxtLink>
              <button
                v-else-if="item.onClick"
                class="flex items-center w-full text-left p-2 hover:bg-muted rounded-md"
                @click="item.onClick"
              >
                <Icon
                  :name="item.icon"
                  class="w-5 h-5 mr-2 flex-shrink-0"
                />
                <span class="truncate">{{ item.title }}</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>
