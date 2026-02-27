<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <div class="filter-container">
      <el-input
        v-model="searchQuery"
        placeholder="搜索用户名/姓名 / Search user"
        style="width: 200px"
        class="filter-item ant-input"
        clearable
      />
      <el-button type="primary" @click="handleSearch" class="ant-btn">
        <el-icon><Search /></el-icon>
        搜索 / Search
      </el-button>
      <el-button type="success" @click="handleCreate" class="ant-btn">
        <el-icon><Plus /></el-icon>
        新增用户 / Add User
      </el-button>
    </div>
    
    <!-- 数据表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="userList"
        border
        stripe
        class="ant-table"
        row-class-name="ant-table-row"
      >
        <el-table-column type="index" width="50" />
        <el-table-column prop="username" label="用户名 / Username" min-width="120" />
        <el-table-column prop="realName" label="姓名 / Name" min-width="100" />
        <el-table-column prop="email" label="邮箱 / Email" min-width="180" />
        <el-table-column prop="phone" label="电话 / Phone" min-width="120" />
        <el-table-column prop="roleName" label="角色 / Role" min-width="120" />
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
        <el-table-column label="操作 / Actions" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)" class="ant-btn">编辑 / Edit</el-button>
            <el-button type="danger" link @click="handleDelete(row)" class="ant-btn">删除 / Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 分页 -->
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
    
    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      class="ant-modal"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        class="ant-form"
      >
        <el-form-item label="用户名" prop="username" class="ant-form-item">
          <el-input v-model="form.username" :disabled="isEdit" class="ant-input" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit" class="ant-form-item">
          <el-input v-model="form.password" type="password" show-password class="ant-input" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName" class="ant-form-item">
          <el-input v-model="form.realName" class="ant-input" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email" class="ant-form-item">
          <el-input v-model="form.email" class="ant-input" />
        </el-form-item>
        <el-form-item label="电话" prop="phone" class="ant-form-item">
          <el-input v-model="form.phone" class="ant-input" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId" class="ant-form-item">
          <el-select v-model="form.roleId" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员 / Admin" value="admin" />
            <el-option label="操作员 / Operator" value="operator" />
          </el-select>
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
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit" class="ant-btn ant-btn-primary">
          确定 / Save
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import * as userApi from '@/api/users'
import type { User } from '@/types'

const loading = ref(false)
const searchQuery = ref('')
const userList = ref<User[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  id: '',
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  roleId: '',
  status: 1
})

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur', min: 6 }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }]
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await userApi.getUserList({
      page: pagination.page,
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
  pagination.page = 1
  fetchUsers()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchUsers()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchUsers()
}

const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = '新增用户 / Add User'
  Object.assign(form, {
    id: '',
    username: '',
    password: '',
    realName: '',
    email: '',
    phone: '',
    roleId: '',
    status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row: User) => {
  isEdit.value = true
  dialogTitle.value = '编辑用户 / Edit User'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？`, '提示', {
      type: 'warning'
    })
    await userApi.deleteUser(row.id)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      if (isEdit.value) {
        await userApi.updateUser(form.id, form)
        ElMessage.success('更新成功')
      } else {
        await userApi.createUser(form)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      fetchUsers()
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
  fetchUsers()
})
</script>

<style scoped>
.filter-container {
  margin-bottom: 20px;
}

.filter-item {
  margin-right: 10px;
}

.table-container {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>
