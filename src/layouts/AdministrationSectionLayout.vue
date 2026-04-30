<script setup lang="ts">
import SectionLayout from './SectionLayout.vue'
import { BriefcaseBusiness, User, CloudCog, Globe, Key, Gauge, Cpu } from 'lucide-vue-next'

const menuItems = [
  { name: 'administration.projects', label: 'Projects', icon: BriefcaseBusiness },
  { name: '__divider__', label: '', divider: true },
  { name: 'administration.apiKeys', label: 'API Keys', icon: Key },
  { name: 'administration.operators', label: 'Operators', icon: User },
  { name: 'administration.providers', label: 'Providers', icon: CloudCog },
  { name: 'administration.environments', label: 'Environments', icon: Globe },
  { name: '__divider__', label: 'Benchmarking', divider: true },
  { name: 'administration.benchmarkSuites', label: 'Suites', icon: Gauge },
  { name: 'administration.benchmarkProviderConfigs', label: 'Providers Configuration', icon: Cpu },
]
</script>

<template>
  <SectionLayout title="Administration" :menu-items="menuItems">
    <slot />
  </SectionLayout>
</template>
