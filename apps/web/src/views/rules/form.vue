<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑规则' : '创建规则' }}</span>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>
      
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规则名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入规则名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规则类型" prop="ruleType">
              <el-select v-model="form.ruleType" placeholder="选择规则类型" style="width: 100%">
                <el-option label="距离优先" value="distance" />
                <el-option label="负载均衡" value="load" />
                <el-option label="时效优先" value="time" />
                <el-option label="评分优先" value="rating" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="业务类型">
              <el-select v-model="form.businessType" placeholder="选择业务类型" style="width: 100%" clearable>
                <el-option label="即时配送" value="instant" />
                <el-option label="预约配送" value="scheduled" />
                <el-option label="全城送" value="citywide" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-input-number v-model="form.priority" :min="0" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入规则描述" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生效时间">
              <el-date-picker
                v-model="form.effectiveTime"
                type="datetime"
                placeholder="选择生效时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期时间">
              <el-date-picker
                v-model="form.expireTime"
                type="datetime"
                placeholder="选择过期时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider>规则条件配置</el-divider>
        
        <!-- 条件配置区域 -->
        <div class="condition-area">
          <div class="condition-header">
            <span>条件组</span>
            <el-button type="primary" size="small" @click="addCondition">添加条件</el-button>
          </div>
          
          <div v-for="(condition, index) in conditions" :key="index" class="condition-item">
            <el-card shadow="hover">
              <el-row :gutter="10">
                <el-col :span="5">
                  <el-select v-model="condition.field" placeholder="选择字段">
                    <el-option label="距离" value="distance" />
                    <el-option label="时间" value="time" />
                    <el-option label="骑手负载" value="rider_load" />
                    <el-option label="订单金额" value="order_amount" />
                  </el-select>
                </el-col>
                <el-col :span="4">
                  <el-select v-model="condition.operator" placeholder="操作符">
                    <el-option label="=" value="=" />
                    <el-option label="≠" value="!=" />
                    <el-option label=">" value=">" />
                    <el-option label="<" value="<" />
                    <el-option label="≥" value=">=" />
                    <el-option label="≤" value="<=" />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-input v-model="condition.value" placeholder="值" />
                </el-col>
                <el-col :span="4">
                  <el-select v-model="condition.logicType" placeholder="逻辑">
                    <el-option label="AND" value="AND" />
                    <el-option label="OR" value="OR" />
                  </el-select>
                </el-col>
                <el-col :span="5" style="text-align: right">
                  <el-button type="danger" link @click="removeCondition(index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-col>
              </el-row>
            </el-card>
          </div>
        </div>
        
        <el-divider>执行动作配置</el-divider>
        
        <!-- 动作配置区域 -->
        <div class="action-area">
          <div class="action-header">
            <span>执行动作</span>
            <el-button type="primary" size="small" @click="addAction">添加动作</el-button>
          </div>
          
          <div v-for="(action, index) in actions" :key="index" class="action-item">
            <el-card shadow="hover">
              <el-row :gutter="10">
                <el-col :span="10">
                  <el-select v-model="action.actionType" placeholder="动作类型">
                    <el-option label="分配给骑手" value="assign_rider" />
                    <el-option label="加入队列" value="join_queue" />
                    <el-option label="提高优先级" value="increase_priority" />
                    <el-option label="转人工处理" value="manual_process" />
                  </el-select>
                </el-col>
                <el-col :span="9">
                  <el-input v-model="action.config" placeholder="配置参数 (JSON)" />
                </el-col>
                <el-col :span="5" style="text-align: right">
                  <el-button type="danger" link @click="removeAction(index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-col>
              </el-row>
            </el-card>
          </div>
        </div>
      </el-form>
      
      <div class="form-footer">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSave">保存</el-button>
        <el-button type="success" :loading="submitLoading" @click="handleSaveAndPublish">保存并发布</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import * as ruleApi from '@/api/rules'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const formRef = ref<FormInstance>()
const submitLoading = ref(false)

const form = reactive({
  id: '',
  name: '',
  description: '',
  ruleType: '',
  businessType: '',
  priority: 0,
  effectiveTime: undefined as Date | undefined,
  expireTime: undefined as Date | undefined
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  ruleType: [{ required: true, message: '请选择规则类型', trigger: 'change' }]
}

interface Condition {
  field: string
  operator: string
  value: string
  valueType: string
  logicType: string
}

interface Action {
  actionType: string
  config: string
}

const conditions = ref<Condition[]>([])
const actions = ref<Action[]>([])

const addCondition = () => {
  conditions.value.push({
    field: '',
    operator: '=',
    value: '',
    valueType: 'string',
    logicType: 'AND'
  })
}

const removeCondition = (index: number) => {
  conditions.value.splice(index, 1)
}

const addAction = () => {
  actions.value.push({
    actionType: '',
    config: '{}'
  })
}

const removeAction = (index: number) => {
  actions.value.splice(index, 1)
}

const fetchRuleDetail = async () => {
  if (!isEdit.value) return
  try {
    const res = await ruleApi.getRuleDetail(route.params.id as string)
    Object.assign(form, res)
    // TODO: 加载条件和动作
  } catch (error) {
    console.error('获取规则详情失败:', error)
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      if (isEdit.value) {
        await ruleApi.updateRule(form.id, form)
        ElMessage.success('更新成功')
      } else {
        const res = await ruleApi.createRule(form)
        form.id = res.id
        ElMessage.success('创建成功')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '保存失败')
    } finally {
      submitLoading.value = false
    }
  })
}

const handleSaveAndPublish = async () => {
  await handleSave()
  // TODO: 发布当前版本
  router.push('/rules')
}

onMounted(() => {
  fetchRuleDetail()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.condition-area, .action-area {
  margin: 20px 0;
}

.condition-header, .action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
}

.condition-item, .action-item {
  margin-bottom: 10px;
}

.form-footer {
  margin-top: 30px;
  text-align: center;
}
</style>
