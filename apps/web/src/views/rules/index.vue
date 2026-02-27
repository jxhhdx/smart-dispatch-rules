<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>派单规则管理</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增规则
          </el-button>
        </div>
      </template>
      
      <el-empty description="派单规则管理页面待实现" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const handleCreate = () => {
  router.push('/rules/create')
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
