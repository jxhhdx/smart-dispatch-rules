<template>
  <div class="users-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <a-input-search
        v-model:value="searchQuery"
        placeholder="搜索用户名/姓名"
        enter-button
        @search="handleSearch"
        style="width: 300px"
      />
      <a-button type="primary" @click="handleCreate">
        <plus-outlined />
        新增用户
      </a-button>
    </div>
    
    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="userList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 1 ? 'green' : 'red'">
            {{ record.status === 1 ? '启用' : '禁用' }}
          </a-tag>
        </template>
        
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" @click="handleEdit(record)">编辑</a-button>
            <a-button type="link" danger @click="handleDelete(record)">删除</a-button>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <!-- 新增/编辑对话框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      @ok="handleSubmit"
      :confirm-loading="submitLoading"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        layout="vertical"
      >
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="formState.username" :disabled="isEdit" />
        </a-form-item>
        
        <a-form-item label="密码" name="password" v-if="!isEdit">
          <a-input-password v-model:value="formState.password" />
        </a-form-item>
        
        <a-form-item label="姓名" name="realName">
          <a-input v-model:value="formState.realName" />
        </a-form-item>
        
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="formState.email" />
        </a-form-item>
        
        <a-form-item label="电话" name="phone">
          <a-input v-model:value="formState.phone" />
        </a-form-item>
        
        <a-form-item label="角色" name="roleId">
          <a-select v-model:value="formState.roleId" placeholder="请选择角色">
            <a-select-option value="admin">管理员</a-select-option>
            <a-select-option value="operator">操作员</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="formState.status">
            <a-radio :value="1">启用</a-radio>
            <a-radio :value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import * as userApi from '@/api/users'
import type { User } from '@/types'

const loading = ref(false)
const searchQuery = ref('')
const userList = ref<User[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '姓名', dataIndex: 'realName', key: 'realName' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '电话', dataIndex: 'phone', key: 'phone' },
  { title: '角色', dataIndex: 'roleName', key: 'roleName' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action', width: 150 }
]

// 模态框相关
const modalVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const formState = reactive({
  id: '',
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  roleId: undefined,
  status: 1
})

const formRules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址' }]
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await userApi.getUserList({
      page: pagination.current,
      pageSize: pagination.pageSize
    })
    userList.value = res.list
    pagination.total = res.total
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchUsers()
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchUsers()
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(formState, {
    id: '',
    username: '',
    password: '',
    realName: '',
    email: '',
    phone: '',
    roleId: undefined,
    status: 1
  })
  modalVisible.value = true
}

const handleEdit = (record: User) => {
  isEdit.value = true
  Object.assign(formState, record)
  modalVisible.value = true
}

const handleDelete = (record: User) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除用户 "${record.username}" 吗？`,
    onOk: async () => {
      try {
        await userApi.deleteUser(record.id)
        message.success('删除成功')
        fetchUsers()
      } catch (error: any) {
        message.error(error.message || '删除失败')
      }
    }
  })
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (isEdit.value) {
      await userApi.updateUser(formState.id, formState)
      message.success('更新成功')
    } else {
      await userApi.createUser(formState)
      message.success('创建成功')
    }
    
    modalVisible.value = false
    fetchUsers()
  } catch (error: any) {
    if (error.message) {
      message.error(error.message)
    }
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users-container {
  padding: 0;
}

.search-bar {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
}
</style>
