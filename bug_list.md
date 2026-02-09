# Bug 列表

## 已修复 ✅

### 1. 密码输入错误没有提示
- **修复时间**: 2026-02-09
- **问题根源**: 
  - 响应拦截器在 React 组件外部调用 `message.error()`，无法正常显示
  - 错误处理分散在多个地方，没有统一的错误消息提取逻辑
  - 401 错误处理不当：登录密码错误和 Token 过期没有区分处理
- **修复内容**: 
  1. 重构 `apps/web/src/services/api.ts` 响应拦截器，区分处理不同场景的 401 错误
  2. **登录接口 401**（密码错误）：返回错误消息，在登录页面显示 `message.error()`
  3. **其他接口 401**（Token 过期）：显示 `Modal.confirm()` 弹窗，用户确认后再跳转登录页
  4. 添加防重复弹窗机制，避免多个 401 同时触发多个弹窗
  5. 在 `apps/web/src/pages/Login.tsx` 中统一处理登录错误，提取后端返回的错误消息并显示
  6. 在 `apps/web/src/App.tsx` 中添加 `AntApp` 包裹，确保 Ant Design 组件正常工作
- **测试覆盖**: 
  - `apps/web/src/services/api.test.ts` - API 错误处理测试（401 场景覆盖）
  - `apps/web/src/pages/Login.test.tsx` - 登录页面错误处理测试

### 2. 左侧的菜单不管语言怎么切换，都显示英文
- **修复时间**: 2026-02-09
- **问题根源**: 菜单项数组在组件渲染时只计算一次，没有随语言变化重新渲染
- **修复内容**: 
  - 在 `apps/web/src/components/Layout.tsx` 中使用 `useMemo` 包裹 `menuItems`
  - 将 `t` 函数添加到依赖项数组，确保语言切换时重新计算菜单项
- **测试覆盖**: 
  - `apps/web/src/components/Layout.test.tsx` - 菜单国际化测试

---

## 测试覆盖汇总

### 前端测试 (Vitest)

| 测试文件 | 测试数量 | 覆盖内容 |
|---------|---------|---------|
| `src/services/api.test.ts` | 5 个 | API 错误处理、响应拦截器 |
| `src/pages/Login.test.tsx` | 12 个 | 登录错误处理、表单验证、API 集成 |
| `src/components/Layout.test.tsx` | 10 个 | 菜单国际化、语言切换 |

**前端总计**: ✅ 27 个测试通过

### 后端测试 (Jest)

| 测试文件 | 测试数量 | 覆盖内容 |
|---------|---------|---------|
| `test/unit/auth/auth.service.spec.ts` | 10 个 | 认证服务、用户验证、Token 生成 |
| `test/unit/auth/auth.controller.spec.ts` | 4 个 | 认证控制器 |
| `test/unit/users/users.service.spec.ts` | 8 个 | 用户管理服务 |
| `test/unit/roles/roles.service.spec.ts` | 9 个 | 角色管理服务 |
| `test/unit/rules/rules.service.spec.ts` | 10 个 | 规则管理服务 |
| `test/unit/logs/logs.service.spec.ts` | 6 个 | 日志管理服务 |

**后端总计**: ✅ 47 个测试通过

### 后端 E2E 测试

| 测试文件 | 覆盖内容 |
|---------|---------|
| `test/e2e/auth-error-messages.e2e-spec.ts` | 登录错误消息本地化测试 |
| `test/e2e/i18n-menu.e2e-spec.ts` | 菜单国际化 API 测试 |

**注意**: E2E 测试需要独立的数据库环境，避免与其他测试冲突

---

## 快速启动/停止（推荐）

### 启动所有服务
```bash
./scripts/start-local.sh
```

### 只启动后端
```bash
./scripts/start-local.sh backend
```

### 只启动前端
```bash
./scripts/start-local.sh frontend
```

### 停止所有服务
```bash
./scripts/stop-local.sh
```

### 只停止前端
```bash
./scripts/stop-local.sh frontend
```

### 只停止后端
```bash
./scripts/stop-local.sh backend
```

### 强制停止（清理残留进程）
```bash
./scripts/stop-local.sh force
```

## 运行测试

### 前端测试
```bash
cd apps/web
npm run test
```

### 后端单元测试
```bash
cd apps/api
npm run test:unit
```

### 后端 E2E 测试（需要独立数据库）
```bash
cd apps/api
# 确保使用测试数据库
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_dispatch_test" npm run test:e2e
```

---

## 修改的文件

### 前端
1. `apps/web/src/services/api.ts` - 重构错误处理拦截器
2. `apps/web/src/pages/Login.tsx` - 添加错误消息显示
3. `apps/web/src/components/Layout.tsx` - 修复菜单国际化
4. `apps/web/src/stores/auth.ts` - 确保错误传播

### 后端测试文件
1. `apps/api/test/unit/auth/auth.service.spec.ts`
2. `apps/api/test/unit/auth/auth.controller.spec.ts`
3. `apps/api/test/unit/users/users.service.spec.ts`
4. `apps/api/test/unit/roles/roles.service.spec.ts`
5. `apps/api/test/unit/rules/rules.service.spec.ts`
6. `apps/api/test/unit/logs/logs.service.spec.ts`
7. `apps/api/test/e2e/auth-error-messages.e2e-spec.ts` (新增)
8. `apps/api/test/e2e/i18n-menu.e2e-spec.ts` (新增)
9. `apps/api/jest.config.js` - 支持 `.e2e-spec.ts` 文件

---

## 验证步骤

1. **刷新浏览器页面** (F5 或 Cmd+R)
2. 访问 http://localhost:3000
3. 输入错误密码登录
4. 应该看到红色错误提示：**"用户名或密码错误"**
5. 切换语言，左侧菜单应该正确显示对应语言
