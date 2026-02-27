<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 class="login-title">智能派单系统</h2>
      </template>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        @keyup.enter="handleLogin"
        class="ant-form"
      >
        <el-form-item prop="username" class="ant-form-item">
          <el-input
            v-model="loginForm.username"
            placeholder="Username / 用户名"
            :prefix-icon="User"
            size="large"
            class="ant-input"
          />
        </el-form-item>
        
        <el-form-item prop="password" class="ant-form-item">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="Password / 密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            class="ant-input"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            size="large"
            style="width: 100%"
            @click="handleLogin"
            class="ant-btn"
          >
            Login / 登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-tips">
        <p>默认账号: admin</p>
        <p>默认密码: admin123</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      await userStore.login({
        username: loginForm.username,
        password: loginForm.password
      })
      ElMessage.success({
        message: '登录成功',
        customClass: 'ant-message-success'
      })
      router.push('/dashboard')
    } catch (error: any) {
      ElMessage.error({
        message: error.message || '登录失败',
        customClass: 'ant-message-error'
      })
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
}

.login-title {
  text-align: center;
  margin: 0;
  color: #303133;
}

.login-tips {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  color: #909399;
  font-size: 14px;
  text-align: center;
}

.login-tips p {
  margin: 5px 0;
}

/* 适配 E2E 测试的 Ant Design 类名 */
:deep(.ant-form-item__error) {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
}

:deep(.el-form-item__error) {
  color: #f56c6c;
  font-size: 12px;
}
</style>
