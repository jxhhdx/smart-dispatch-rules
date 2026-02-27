<template>
  <div class="app-container">
    <el-card class="ant-card">
      <template #header>
        <div class="card-header">
          <span>角色权限管理 / Role Management</span>
          <el-button type="primary" @click="handleCreate" class="ant-btn">
            <el-icon><Plus /></el-icon>
            新增角色 / Add Role
          </el-button>
        </div>
      </template>
      
      <el-table :data="roleList" v-loading="loading" border stripe class="ant-table" row-class-name="ant-table-row">
        <el-table-column type="index" width="50" />
        <el-table-column prop="name" label="角色名称 / Role Name" min-width="150" />
        <el-table-column prop="code" label="角色编码 / Code" min-width="150" />
        <el-table-column prop="description" label="描述 / Description" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态 / Status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间 / Created" min-width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作 / Actions" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)" class="ant-btn">编辑 / Edit</el-button>
            <el-button type="primary" link @click="handlePermission(row)" class="ant-btn">权限 / Permission</el-button>
            <el-button type="danger" link @click="handleDelete(row)" class="ant-btn">删除 / Delete</el-button>
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
          class="ant-pagination"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑角色对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" class="ant-modal">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="ant-form">
        <el-form-item label="角色名称" prop="name" class="ant-form-item">
          <el-input v-model="form.name" placeholder="请输入角色名称" class="ant-input" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code" class="ant-form-item">
          <el-input v-model="form.code" placeholder="请输入角色编码" :disabled="isEdit" class="ant-input" />
        </el-form-item>
        <el-form-item label="描述" class="ant-form-item">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态" prop="status" class="ant-form-item">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用 / Enabled</el-radio>
            <el-radio :label="0">禁用 / Disabled</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false" class="ant-btn">取消 / Cancel</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit" class="ant-btn ant-btn-primary">确定 / Save</el-button>
      </template>
    </el-dialog>
    
    <!-- 权限配置对话框 -->
    <el-dialog v-model="permissionDialogVisible" title="配置权限 / Configure Permission" width="600px" class="ant-modal">
      <el-tree
        ref="treeRef"
        :data="permissionTree"
        show-checkbox
        node-key="id"
        :default-expand-all="true"
        :props="{ label: 'name', children: 'children' }"
        class="ant-tree"
      />
      <template #footer>
        <el-button @click="permissionDialogVisible = false" class="ant-btn">取消 / Cancel</el-button>
        <el-button type="primary" :loading="permissionLoading" @click="handleSavePermission" class="ant-btn ant-btn-primary">保存 / Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, ElTree } from 'element-plus'
import * as roleApi from '@/api/roles'
import type { Role, Permission } from '@/types'

const loading = ref(false)
const roleList = ref<Role[]>([])
const permissionTree = ref<Permission[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const dialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const submitLoading = ref(false)
const permissionLoading = ref(false)
const formRef = ref<FormInstance>()
const treeRef = ref<InstanceType<typeof ElTree>>()
const currentRoleId = ref('')

const form = reactive({
  id: '',
  name: '',
  code: '',
  description: '',
  status: 1
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await roleApi.getRoleList({
      page: pagination.page,
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

const fetchPermissions = async () => {
  try {
    const res = await roleApi.getPermissionList()
    permissionTree.value = res
  } catch (error) {
    console.error('获取权限列表失败:', error)
  }
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchRoles()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchRoles()
}

const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = '新增角色 / Add Role'
  Object.assign(form, {
    id: '',
    name: '',
    code: '',
    description: '',
    status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row: Role) => {
  isEdit.value = true
  dialogTitle.value = '编辑角色 / Edit Role'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = async (row: Role) => {
  try {
    await ElMessageBox.confirm(`确定要删除角色 "${row.name}" 吗？`, '提示', {
      type: 'warning'
    })
    await roleApi.deleteRole(row.id)
    ElMessage.success('删除成功')
    fetchRoles()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handlePermission = async (row: Role) => {
  currentRoleId.value = row.id
  permissionDialogVisible.value = true
}

const handleSavePermission = async () => {
  const checkedKeys = treeRef.value?.getCheckedKeys() || []
  const halfCheckedKeys = treeRef.value?.getHalfCheckedKeys() || []
  const allKeys = [...checkedKeys, ...halfCheckedKeys] as string[]
  
  permissionLoading.value = true
  try {
    await roleApi.updateRolePermissions(currentRoleId.value, allKeys)
    ElMessage.success('权限配置已保存')
    permissionDialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    permissionLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      if (isEdit.value) {
        await roleApi.updateRole(form.id, form)
        ElMessage.success('更新成功')
      } else {
        await roleApi.createRole(form)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      fetchRoles()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitLoading.value = false
    }
  })
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

onMounted(() => {
  fetchRoles()
  fetchPermissions()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>
