<template>
  <div class="rule-form-container">
    <a-card :title="isEdit ? '编辑规则' : '创建规则'">
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="规则名称" name="name">
              <a-input v-model:value="form.name" placeholder="请输入规则名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="规则类型" name="ruleType">
              <a-select v-model:value="form.ruleType" placeholder="选择规则类型">
                <a-select-option value="distance">距离优先</a-select-option>
                <a-select-option value="load">负载均衡</a-select-option>
                <a-select-option value="time">时效优先</a-select-option>
                <a-select-option value="rating">评分优先</a-select-option>
                <a-select-option value="custom">自定义</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="业务类型">
              <a-select v-model:value="form.businessType" placeholder="选择业务类型" allow-clear>
                <a-select-option value="instant">即时配送</a-select-option>
                <a-select-option value="scheduled">预约配送</a-select-option>
                <a-select-option value="citywide">全城送</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="优先级">
              <a-input-number v-model:value="form.priority" :min="0" :max="100" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" :rows="3" placeholder="请输入规则描述" />
        </a-form-item>
        
        <a-form-item>
          <a-space>
            <a-button @click="$router.back()">取消</a-button>
            <a-button type="primary" :loading="submitLoading" @click="handleSave">保存</a-button>
            <a-button type="primary" danger :loading="submitLoading" @click="handleSaveAndPublish">保存并发布</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import * as ruleApi from '@/api/rules'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const submitLoading = ref(false)

const isEdit = ref(false)
const ruleId = ref('')

const form = reactive({
  name: '',
  description: '',
  ruleType: '',
  businessType: '',
  priority: 0,
  effectiveTime: null,
  expireTime: null
})

const rules = {
  name: [{ required: true, message: '请输入规则名称' }],
  ruleType: [{ required: true, message: '请选择规则类型' }]
}

const fetchRuleDetail = async (id: string) => {
  try {
    const res = await ruleApi.getRuleDetail(id)
    Object.assign(form, res)
  } catch (error) {
    console.error('获取规则详情失败:', error)
  }
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (isEdit.value) {
      await ruleApi.updateRule(ruleId.value, form)
      message.success('更新成功')
    } else {
      await ruleApi.createRule(form)
      message.success('创建成功')
    }
    
    router.push('/rules')
  } catch (error: any) {
    if (error.message) message.error(error.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}

const handleSaveAndPublish = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    // 先保存
    let id = ruleId.value
    if (isEdit.value) {
      await ruleApi.updateRule(ruleId.value, form)
    } else {
      const res = await ruleApi.createRule(form)
      id = res.id
    }
    
    // 再发布
    await ruleApi.updateRuleStatus(id, 1)
    message.success('保存并发布成功')
    router.push('/rules')
  } catch (error: any) {
    if (error.message) message.error(error.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  const id = route.params.id as string
  if (id) {
    isEdit.value = true
    ruleId.value = id
    fetchRuleDetail(id)
  }
})
</script>

<style scoped>
.rule-form-container {
  padding: 0;
}
</style>
