<template>
  <div class="dashboard-container">
    <h2>Dashboard</h2>
    
    <!-- 统计卡片 -->
    <a-row :gutter="16">
      <a-col :span="6" v-for="item in statCards" :key="item.title">
        <a-card>
          <a-statistic
            :title="item.title"
            :value="item.value"
            :value-style="{ color: item.color }"
          >
            <template #prefix>
              <component :is="item.icon" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>
    
    <!-- 图表区域 -->
    <a-row :gutter="16" class="chart-row">
      <a-col :span="16">
        <a-card title="订单趋势 / Order Trend">
          <v-chart class="chart" :option="orderChartOption" autoresize />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="规则触发统计 / Rule Stats">
          <v-chart class="chart" :option="ruleChartOption" autoresize />
        </a-card>
      </a-col>
    </a-row>
    
    <!-- 实时数据 -->
    <a-card title="实时数据 / Realtime Data" class="realtime-card">
      <template #extra>
        <a-tag color="green">
          <check-circle-outlined />
          系统运行中
        </a-tag>
      </template>
      <a-row :gutter="16">
        <a-col :span="4" v-for="item in realtimeItems" :key="item.label">
          <div class="realtime-item">
            <div class="realtime-label">{{ item.label }}</div>
            <div class="realtime-value" :style="{ color: item.color }">{{ item.value }}</div>
          </div>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons-vue'
import * as dashboardApi from '@/api/dashboard'
import type { DashboardStats } from '@/types'

const stats = ref<DashboardStats | null>(null)

const statCards = ref([
  { title: '今日订单', value: 0, icon: 'ShoppingCartOutlined', color: '#1890ff' },
  { title: '已派单', value: 0, icon: 'CheckCircleOutlined', color: '#52c41a' },
  { title: '成功率', value: '0%', icon: 'RiseOutlined', color: '#faad14' },
  { title: '活跃骑手', value: 0, icon: 'TeamOutlined', color: '#f5222d' }
])

const realtimeItems = ref([
  { label: '待派单', value: 0, color: '#faad14' },
  { label: '派单中', value: 0, color: '#1890ff' },
  { label: '配送中', value: 0, color: '#52c41a' },
  { label: '今日完成', value: 0, color: '#722ed1' },
  { label: '在线骑手', value: 0, color: '#52c41a' },
  { label: '空闲骑手', value: 0, color: '#8c8c8c' }
])

// 订单趋势图表配置
const orderChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['订单量', '派单量']
  },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '订单量',
      type: 'line',
      data: [120, 132, 101, 134, 90, 230, 210],
      smooth: true,
      itemStyle: { color: '#1890ff' }
    },
    {
      name: '派单量',
      type: 'line',
      data: [220, 182, 191, 234, 290, 330, 310],
      smooth: true,
      itemStyle: { color: '#52c41a' }
    }
  ]
}))

// 规则触发图表配置
const ruleChartOption = computed(() => ({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center'
  },
  series: [
    {
      name: '规则触发',
      type: 'pie',
      radius: ['50%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 1048, name: '距离优先', itemStyle: { color: '#1890ff' } },
        { value: 735, name: '负载均衡', itemStyle: { color: '#52c41a' } },
        { value: 580, name: '时效优先', itemStyle: { color: '#faad14' } },
        { value: 484, name: '评分优先', itemStyle: { color: '#f5222d' } }
      ]
    }
  ]
}))

const fetchStats = async () => {
  try {
    stats.value = await dashboardApi.getStats()
    // 更新统计卡片数据
    statCards.value[0].value = stats.value?.todayOrders || 0
    statCards.value[1].value = stats.value?.todayDispatched || 0
    statCards.value[2].value = (stats.value?.todaySuccessRate || 0).toFixed(1) + '%'
    statCards.value[3].value = stats.value?.activeRiders || 0
    
    // 更新实时数据
    const realtime = await dashboardApi.getRealtime()
    realtimeItems.value[0].value = realtime.pendingOrders
    realtimeItems.value[1].value = realtime.dispatchingOrders
    realtimeItems.value[2].value = realtime.deliveringOrders
    realtimeItems.value[3].value = realtime.completedToday
    realtimeItems.value[4].value = realtime.activeRiders
    realtimeItems.value[5].value = realtime.idleRiders
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
  padding: 0;
}

h2 {
  margin-bottom: 24px;
}

.chart-row {
  margin-top: 24px;
}

.chart {
  height: 350px;
}

.realtime-card {
  margin-top: 24px;
}

.realtime-item {
  text-align: center;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
}

.realtime-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.realtime-value {
  font-size: 24px;
  font-weight: bold;
}
</style>
