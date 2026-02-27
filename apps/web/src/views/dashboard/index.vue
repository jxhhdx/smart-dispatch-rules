<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="item in statCards" :key="item.title">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-item">
            <div class="stat-icon" :style="{ backgroundColor: item.color }">
              <el-icon :size="40" color="#fff">
                <component :is="item.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">{{ item.title }}</div>
              <div class="stat-value">{{ item.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>订单趋势</span>
          </template>
          <div class="chart-placeholder">
            <el-empty description="图表组件待实现" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>规则触发统计</span>
          </template>
          <div class="chart-placeholder">
            <el-empty description="图表组件待实现" />
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 实时数据 -->
    <el-card class="realtime-card">
      <template #header>
        <span>实时数据</span>
        <el-tag type="success" effect="dark" class="online-tag">
          <el-icon><CircleCheck /></el-icon>
          系统运行中
        </el-tag>
      </template>
      <el-row :gutter="20">
        <el-col :span="4" v-for="item in realtimeItems" :key="item.label">
          <div class="realtime-item">
            <div class="realtime-label">{{ item.label }}</div>
            <div class="realtime-value" :class="item.type">{{ item.value }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as dashboardApi from '@/api/dashboard'
import type { DashboardStats } from '@/types'

const stats = ref<DashboardStats | null>(null)

const statCards = ref([
  { title: '今日订单', value: '0', icon: 'ShoppingCart', color: '#409eff' },
  { title: '已派单', value: '0', icon: 'Position', color: '#67c23a' },
  { title: '成功率', value: '0%', icon: 'TrendCharts', color: '#e6a23c' },
  { title: '活跃骑手', value: '0', icon: 'User', color: '#f56c6c' }
])

const realtimeItems = ref([
  { label: '待派单', value: 0, type: 'warning' },
  { label: '派单中', value: 0, type: 'primary' },
  { label: '配送中', value: 0, type: 'success' },
  { label: '今日完成', value: 0, type: '' },
  { label: '在线骑手', value: 0, type: 'success' },
  { label: '空闲骑手', value: 0, type: 'info' }
])

const fetchStats = async () => {
  try {
    stats.value = await dashboardApi.getStats()
    // 更新统计卡片数据
    statCards.value[0].value = String(stats.value?.todayOrders || 0)
    statCards.value[1].value = String(stats.value?.todayDispatched || 0)
    statCards.value[2].value = (stats.value?.todaySuccessRate || 0).toFixed(1) + '%'
    statCards.value[3].value = String(stats.value?.activeRiders || 0)
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
}

.stat-title {
  color: #909399;
  font-size: 14px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.chart-row {
  margin-top: 10px;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.realtime-card {
  margin-top: 20px;
}

.online-tag {
  float: right;
}

.realtime-item {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.realtime-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 10px;
}

.realtime-value {
  font-size: 24px;
  font-weight: bold;
}

.realtime-value.primary { color: #409eff; }
.realtime-value.success { color: #67c23a; }
.realtime-value.warning { color: #e6a23c; }
.realtime-value.info { color: #909399; }
</style>
