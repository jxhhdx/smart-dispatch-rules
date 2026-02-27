<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>派单规则管理</span>
          <div>
            <el-button type="success" @click="handleExport" style="margin-right: 10px">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              新增规则
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <div class="filter-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索规则名称"
          style="width: 200px"
          class="filter-item"
        />
        <el-select v-model="filterStatus" placeholder="状态" style="width: 120px" clearable>
          <el-option label="草稿" :value="0" />
          <el-option label="已启用" :value="1" />
          <el-option label="已禁用" :value="2" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
      
      <el-table :data="ruleList" v-loading="loading" border stripe>
        <el-table-column type="index" width="50" />
        <el-table-column prop="name" label="规则名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="handleEdit(row)">{{ row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="ruleType" label="规则类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ formatRuleType(row.ruleType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="businessType" label="业务类型" width="120" />
        <el-table-column prop="priority" label="优先级" width="100" sortable />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentVersion" label="当前版本" width="100" />
        <el-table-column prop="createdByName" label="创建人" width="120" />
        <el-table-column prop="createdAt" label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleVersions(row)">版本</el-button>
            <el-button type="primary" link @click="handleClone(row)">复制</el-button>
            <el-dropdown @command="(cmd) => handleMore(cmd, row)">
              <el-button type="primary" link>
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="enable" v-if="row.status !== 1">启用</el-dropdown-item>
                  <el-dropdown-item command="disable" v-if="row.status === 1">禁用</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    
    <!-- 版本管理对话框 -->
    <el-dialog v-model="versionDialogVisible" title="版本管理" width="800px">
      <el-table :data="versionList" border stripe>
        <el-table-column prop="version" label="版本号" width="100" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 1"
              type="primary"
              link
              @click="handlePublish(row)"
            >发布</el-button>
            <el-button type="primary" link @click="handleViewVersion(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as ruleApi from '@/api/rules'
import type { Rule, RuleVersion } from '@/types'

const router = useRouter()
const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref<number | undefined>(undefined)
const ruleList = ref<Rule[]>([])
const versionList = ref<RuleVersion[]>([])
const versionDialogVisible = ref(false)
const currentRuleId = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const fetchRules = async () => {
  loading.value = true
  try {
    const res = await ruleApi.getRuleList({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    ruleList.value = res.list
    pagination.total = res.total
  } catch (error) {
    console.error('获取规则列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchRules()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchRules()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchRules()
}

const handleCreate = () => {
  router.push('/rules/create')
}

const handleEdit = (row: Rule) => {
  router.push(`/rules/edit/${row.id}`)
}

const handleVersions = async (row: Rule) => {
  currentRuleId.value = row.id
  versionDialogVisible.value = true
  try {
    const res = await ruleApi.getRuleVersions(row.id)
    versionList.value = res
  } catch (error) {
    console.error('获取版本列表失败:', error)
  }
}

const handleClone = async (row: Rule) => {
  try {
    await ruleApi.cloneRule(row.id)
    ElMessage.success('复制成功')
    fetchRules()
  } catch (error: any) {
    ElMessage.error(error.message || '复制失败')
  }
}

const handleExport = async () => {
  try {
    const blob = await ruleApi.exportRule('all')
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rules_${Date.now()}.json`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败')
  }
}

const handlePublish = async (row: RuleVersion) => {
  try {
    await ruleApi.publishVersion(currentRuleId.value, row.id)
    ElMessage.success('发布成功')
    handleVersions({ id: currentRuleId.value } as Rule)
  } catch (error: any) {
    ElMessage.error(error.message || '发布失败')
  }
}

const handleViewVersion = (row: RuleVersion) => {
  // TODO: 查看版本详情
  console.log('查看版本', row)
}

const handleMore = async (cmd: string, row: Rule) => {
  switch (cmd) {
    case 'enable':
      try {
        await ruleApi.updateRuleStatus(row.id, 1)
        ElMessage.success('启用成功')
        fetchRules()
      } catch (error: any) {
        ElMessage.error(error.message || '启用失败')
      }
      break
    case 'disable':
      try {
        await ruleApi.updateRuleStatus(row.id, 2)
        ElMessage.success('禁用成功')
        fetchRules()
      } catch (error: any) {
        ElMessage.error(error.message || '禁用失败')
      }
      break
    case 'delete':
      try {
        await ElMessageBox.confirm(`确定要删除规则 "${row.name}" 吗？`, '提示', {
          type: 'warning'
        })
        await ruleApi.deleteRule(row.id)
        ElMessage.success('删除成功')
        fetchRules()
      } catch (error: any) {
        if (error !== 'cancel') {
          ElMessage.error(error.message || '删除失败')
        }
      }
      break
  }
}

const formatRuleType = (type: string) => {
  const map: Record<string, string> = {
    'distance': '距离优先',
    'load': '负载均衡',
    'time': '时效优先',
    'rating': '评分优先',
    'custom': '自定义'
  }
  return map[type] || type
}

const getStatusType = (status: number) => {
  const map: Record<number, string> = {
    0: 'info',
    1: 'success',
    2: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '草稿',
    1: '已启用',
    2: '已禁用'
  }
  return map[status] || '未知'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

onMounted(() => {
  fetchRules()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-item {
  margin-right: 10px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>
