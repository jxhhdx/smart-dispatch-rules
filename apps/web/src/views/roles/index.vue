<template>
  <div class="roles-container">
    <div class="toolbar">
      <a-button type="primary" @click="handleCreate">
        <plus-outlined />
        新增角色
      </a-button>
    </div>
    
    <a-table
      :columns="columns"
      :data-source="roleList"
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
            <a-button type="link" @click="handlePermission(record)">权限</a-button>
            <a-button type="link" danger @click="handleDelete(record)">删除</a-button>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <!-- 新增/编辑角色 -->
    <a-modal
      v-model:open="roleModalVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      @ok="handleSubmit"
    >
      <a-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        layout="vertical"
      >
        <a-form-item label="角色名称" name="name">
          <a-input v-model:value="roleForm.name" />
        </a-form-item>
        
        <a-form-item label="角色编码" name="code">
          <a-input v-model:value="roleForm.code" :disabled="isEdit" />
        </a-form-item>
        
        <a-form-item label="描述">
          <a-textarea v-model:value="roleForm.description" />
        </a-form-item>
        
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="roleForm.status">
            <a-radio :value="1">启用</a-radio>
            <a-radio :value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
    
    <!-- 权限配置 -->
    <a-modal
      v-model:open="permModalVisible"
      title="配置权限"
      width="600px"
      @ok="handleSavePermission"
    >
      <a-tree
        v-model:checked-keys="checkedKeys"
        checkable
        :tree-data="permissionTree"
        :field-names="{ title: 'name', key: 'id' }"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import * as roleApi from '@/api/roles'
import type { Role, Permission } from '@/types'

const loading = ref(false)
const roleList = ref<Role[]>([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

const columns = [
  { title: '角色名称', dataIndex: 'name', key: 'name' },
  { title: '角色编码', dataIndex: 'code', key: 'code' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action', width: 200 }
]

// 角色模态框
const roleModalVisible = ref(false)
const isEdit = ref(false)
const roleFormRef = ref()
const roleForm = reactive({
  id: '',
  name: '',
  code: '',
  description: '',
  status: 1
})
const roleRules = {
  name: [{ required: true, message: '请输入角色名称' }],
  code: [{ required: true, message: '请输入角色编码' }]
}

// 权限模态框
const permModalVisible = ref(false)
const permissionTree = ref<Permission[]>([])
const checkedKeys = ref<string[]>([])
const currentRoleId = ref('')

const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await roleApi.getRoleList({
      page: pagination.current,
      pageSize: pagination.pageSize
    })
    roleList.value = res.list
    pagination.total = res.total
  } catch (error) {
    console.error('获取角色列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchRoles()
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(roleForm, {
    id: '',
    name: '',
    code: '',
    description: '',
    status: 1
  })
  roleModalVisible.value = true
}

const handleEdit = (record: Role) => {
  isEdit.value = true
  Object.assign(roleForm, record)
  roleModalVisible.value = true
}

const handleDelete = (record: Role) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除角色 "${record.name}" 吗？`,
    onOk: async () => {
      try {
        await roleApi.deleteRole(record.id)
        message.success('删除成功')
        fetchRoles()
      } catch (error: any) {
        message.error(error.message || '删除失败')
      }
    }
  })
}

const handleSubmit = async () => {
  try {
    await roleFormRef.value.validate()
    if (isEdit.value) {
      await roleApi.updateRole(roleForm.id, roleForm)
      message.success('更新成功')
    } else {
      await roleApi.createRole(roleForm)
      message.success('创建成功')
    }
    roleModalVisible.value = false
    fetchRoles()
  } catch (error: any) {
    if (error.message) message.error(error.message)
  }
}

// 权限相关
const handlePermission = async (record: Role) => {
  currentRoleId.value = record.id
  permModalVisible.value = true
  try {
    const res = await roleApi.getPermissionList()
    permissionTree.value = res
    // TODO: 获取角色已有权限并设置 checkedKeys
  } catch (error) {
    console.error('获取权限列表失败:', error)
  }
}

const handleSavePermission = async () => {
  try {
    await roleApi.updateRolePermissions(currentRoleId.value, checkedKeys.value)
    message.success('权限配置已保存')
    permModalVisible.value = false
  } catch (error: any) {
    message.error(error.message || '保存失败')
  }
}

onMounted(() => {
  fetchRoles()
})
</script>

<style scoped>
.roles-container {
  padding: 0;
}

.toolbar {
  margin-bottom: 16px;
}
</style>
