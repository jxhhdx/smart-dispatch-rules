<template>
  <div class="rules-container">
    <div class="toolbar">
      <a-space>
        <a-input-search
          v-model:value="searchQuery"
          placeholder="搜索规则名称"
          @search="handleSearch"
          style="width: 250px"
        />
        <a-button type="primary" @click="handleCreate">
          <plus-outlined />
          新增规则
        </a-button>
      </a-space>
    </div>
    
    <a-table
      :columns="columns"
      :data-source="ruleList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        
        <template v-if="column.key === 'name'">
          <a @click="handleEdit(record)">{{ record.name }}</a>
        </template>
        
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" @click="handleEdit(record)">编辑</a-button>
            <a-button type="link" @click="handleVersions(record)">版本</a-button>
            <a-button type="link" @click="handleClone(record)">复制</a-button>
            <a-dropdown>
              <a-button type="link">更多<a-down-outlined /></a-button>
              <template #overlay>
                <a-menu @click="({ key }) => handleMore(key, record)">
                  <a-menu-item key="enable" v-if="record.status !== 1">启用</a-menu-item>
                  <a-menu-item key="disable" v-if="record.status === 1">禁用</a-menu-item>
                  <a-menu-item key="delete" danger>删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <!-- 版本管理 -->
    <a-modal
      v-model:open="versionModalVisible"
      title="版本管理"
      width="800px"
      :footer="null"
    >
      <a-table
        :columns="versionColumns"
        :data-source="versionList"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button 
                type="link" 
                v-if="record.status !== 1"
                @click="handlePublish(record)"
              >
                发布
              </a-button>
              <a-button type="link" @click="handleViewVersion(record)">查看</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, DownOutlined } from '@ant-design/icons-vue'
import * as ruleApi from '@/api/rules'
import type { Rule, RuleVersion } from '@/types'

const router = useRouter()
const loading = ref(false)
const searchQuery = ref('')
const ruleList = ref<Rule[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

const columns = [
  { title: '规则名称', dataIndex: 'name', key: 'name' },
  { title: '规则类型', dataIndex: 'ruleType', key: 'ruleType' },
  { title: '业务类型', dataIndex: 'businessType', key: 'businessType' },
  { title: '优先级', dataIndex: 'priority', key: 'priority', sorter: true },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '当前版本', dataIndex: 'currentVersion', key: 'currentVersion' },
  { title: '创建人', dataIndex: 'createdByName', key: 'createdByName' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action', width: 280 }
]

const versionModalVisible = ref(false)
const versionList = ref<RuleVersion[]>([])
const currentRuleId = ref('')

const versionColumns = [
  { title: '版本号', dataIndex: 'version', key: 'version' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action' }
]

const fetchRules = async () => {
  loading.value = true
  try {
    const res = await ruleApi.getRuleList({
      page: pagination.current,
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
  pagination.current = 1
  fetchRules()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchRules()
}

const handleCreate = () => {
  router.push('/rules/create')
}

const handleEdit = (record: Rule) => {
  router.push(`/rules/edit/${record.id}`)
}

const handleVersions = async (record: Rule) => {
  currentRuleId.value = record.id
  versionModalVisible.value = true
  try {
    const res = await ruleApi.getRuleVersions(record.id)
    versionList.value = res
  } catch (error) {
    console.error('获取版本列表失败:', error)
  }
}

const handleClone = async (record: Rule) => {
  try {
    await ruleApi.cloneRule(record.id)
    message.success('复制成功')
    fetchRules()
  } catch (error: any) {
    message.error(error.message || '复制失败')
  }
}

const handlePublish = async (record: RuleVersion) => {
  try {
    await ruleApi.publishVersion(currentRuleId.value, record.id)
    message.success('发布成功')
    handleVersions({ id: currentRuleId.value } as Rule)
  } catch (error: any) {
    message.error(error.message || '发布失败')
  }
}

const handleViewVersion = (record: RuleVersion) => {
  console.log('查看版本', record)
}

const handleMore = (key: string, record: Rule) => {
  switch (key) {
    case 'enable':
      Modal.confirm({
        title: '确认启用',
        content: `确定要启用规则 "${record.name}" 吗？`,
        onOk: async () => {
          try {
            await ruleApi.updateRuleStatus(record.id, 1)
            message.success('启用成功')
            fetchRules()
          } catch (error: any) {
            message.error(error.message || '启用失败')
          }
        }
      })
      break
    case 'disable':
      Modal.confirm({
        title: '确认禁用',
        content: `确定要禁用规则 "${record.name}" 吗？`,
        onOk: async () => {
          try {
            await ruleApi.updateRuleStatus(record.id, 2)
            message.success('禁用成功')
            fetchRules()
          } catch (error: any) {
            message.error(error.message || '禁用失败')
          }
        }
      })
      break
    case 'delete':
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除规则 "${record.name}" 吗？`,
        onOk: async () => {
          try {
            await ruleApi.deleteRule(record.id)
            message.success('删除成功')
            fetchRules()
          } catch (error: any) {
            message.error(error.message || '删除失败')
          }
        }
      })
      break
  }
}

const getStatusColor = (status: number) => {
  const map: Record<number, string> = { 0: 'default', 1: 'green', 2: 'red' }
  return map[status] || 'default'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '草稿', 1: '已启用', 2: '已禁用' }
  return map[status] || '未知'
}

onMounted(() => {
  fetchRules()
})
</script>

<style scoped>
.rules-container {
  padding: 0;
}

.toolbar {
  margin-bottom: 16px;
}
</style>
