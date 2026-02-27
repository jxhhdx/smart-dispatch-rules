<template>
  <div class="login-container">
    <a-card class="login-card">
      <div class="login-header">
        <h2 class="login-title">{{ $t('login.title') }}</h2>
      </div>
      
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        @finish="handleLogin"
        class="login-form"
      >
        <a-form-item name="username">
          <a-input
            v-model:value="formState.username"
            size="large"
            :placeholder="$t('login.username')"
          >
            <template #prefix>
              <user-outlined />
            </template>
          </a-input>
        </a-form-item>
        
        <a-form-item name="password">
          <a-input-password
            v-model:value="formState.password"
            size="large"
            :placeholder="$t('login.password')"
          >
            <template #prefix>
              <lock-outlined />
            </template>
          </a-input-password>
        </a-form-item>
        
        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            :loading="loading"
            block
          >
            {{ $t('login.submit') }}
          </a-button>
        </a-form-item>
      </a-form>
      
      <div class="login-tips">
        <p>默认账号: admin / admin123</p>
      </div>
      
      <!-- 语言切换 -->
      <div class="lang-switch">
        <a-select
          v-model:value="currentLang"
          size="small"
          style="width: 100px"
          @change="handleLangChange"
        >
          <a-select-option value="zh-CN">中文</a-select-option>
          <a-select-option value="en-US">English</a-select-option>
        </a-select>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import i18n from '@/i18n'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const currentLang = computed(() => i18n.global.locale.value)

const formState = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }]
}

const handleLogin = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    await userStore.login({
      username: formState.username,
      password: formState.password
    })
    message.success(i18n.global.t('login.success'))
    router.push('/dashboard')
  } catch (error: any) {
    if (error.response?.status === 422) {
      message.error('请求格式错误，请检查输入')
    } else {
      message.error(error.message || i18n.global.t('login.error'))
    }
  } finally {
    loading.value = false
  }
}

const handleLangChange = (val: string) => {
  i18n.global.locale.value = val
  localStorage.setItem('locale', val)
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
}

.login-card {
  width: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-title {
  font-size: 24px;
  color: #1890ff;
  margin: 0;
}

.login-form {
  margin-top: 20px;
}

.login-tips {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  color: #999;
  font-size: 14px;
  text-align: center;
}

.login-tips p {
  margin: 0;
}

.lang-switch {
  margin-top: 16px;
  text-align: center;
}
</style>
