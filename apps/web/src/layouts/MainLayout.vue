<template>
  <a-layout class="layout-container">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      class="sidebar"
    >
      <div class="logo">
        <span v-if="!collapsed">{{ $t('login.title') }}</span>
        <span v-else>派单</span>
      </div>
      
      <a-menu
        :selected-keys="[selectedKey]"
        :open-keys="openKeys"
        mode="inline"
        theme="dark"
        @click="handleMenuClick"
      >
        <a-menu-item key="/dashboard">
          <dashboard-outlined />
          <span>{{ $t('menu.dashboard') }}</span>
        </a-menu-item>
        
        <a-menu-item key="/rules">
          <file-text-outlined />
          <span>{{ $t('menu.rules') }}</span>
        </a-menu-item>
        
        <a-sub-menu key="/system">
          <template #title>
            <setting-outlined />
            <span>系统管理</span>
          </template>
          <a-menu-item key="/users">
            <user-outlined />
            <span>{{ $t('menu.users') }}</span>
          </a-menu-item>
          <a-menu-item key="/roles">
            <team-outlined />
            <span>{{ $t('menu.roles') }}</span>
          </a-menu-item>
          <a-menu-item key="/logs">
            <file-search-outlined />
            <span>{{ $t('menu.logs') }}</span>
          </a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>
    
    <a-layout>
      <!-- 顶部导航 -->
      <a-layout-header class="header">
        <div class="header-left">
          <menu-unfold-outlined
            v-if="collapsed"
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          />
          <menu-fold-outlined
            v-else
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          />
        </div>
        
        <div class="header-right">
          <!-- 语言切换 -->
          <a-select
            v-model:value="currentLang"
            size="small"
            style="width: 100px; margin-right: 16px"
            @change="handleLangChange"
          >
            <a-select-option value="zh-CN">中文</a-select-option>
            <a-select-option value="en-US">English</a-select-option>
          </a-select>
          
          <a-dropdown>
            <span class="user-info">
              <user-outlined />
              {{ userStore.username || 'admin' }}
              <down-outlined />
            </span>
            <template #overlay>
              <a-menu @click="handleUserMenuClick">
                <a-menu-item key="logout">
                  <logout-outlined />
                  {{ $t('menu.logout') }}
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      
      <!-- 主内容区 -->
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal } from 'ant-design-vue'
import {
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  FileSearchOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DownOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import i18n from '@/i18n'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const collapsed = ref(false)
const openKeys = ref(['/system'])

const selectedKey = computed(() => route.path)

const currentLang = computed(() => i18n.global.locale.value)

const handleMenuClick = ({ key }: { key: string }) => {
  router.push(key)
}

const handleLangChange = (val: string) => {
  i18n.global.locale.value = val
  localStorage.setItem('locale', val)
}

const handleUserMenuClick = ({ key }: { key: string }) => {
  if (key === 'logout') {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      onOk: () => {
        userStore.logout()
        router.push('/login')
      }
    })
  }
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.sidebar {
  background: #001529;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.content {
  margin: 24px;
  padding: 24px;
  background: #fff;
  min-height: 280px;
  overflow: auto;
}
</style>
