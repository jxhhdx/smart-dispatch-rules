# Bug 列表

## 待观察/追踪 🕵️

### 1. admin 用户数据丢失问题
- **首次发现**: 2026-02-10
- **状态**: 已恢复，正在观察是否会复现
- **现象**: 登录时提示密码错误，数据库中 admin 用户数据缺失
- **修复**: 运行 `npx prisma db seed` 重新初始化数据
- **追踪记录**: [docs/database-issues.md](./docs/database-issues.md)
- **待确认**: 
  - [ ] 是否与 E2E 测试有关
  - [ ] 是否与数据库迁移有关
  - [ ] 是否与 Docker 容器重启有关

---

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

### 2. 左侧的菜单不管语言怎么切换，都显示英文 / 国际化切换无效
- **修复时间**: 2026-02-10
- **问题根源**: 
  1. **菜单项未重新渲染**: `useMemo` 依赖 `[t]`，但 `t` 函数引用在语言变化时不变
  2. **翻译资源加载失败**: i18next 的 HTTP Backend 在 Playwright 测试中无法加载翻译文件
  3. **资源结构错误**: 翻译文件导入时嵌套结构处理不正确（如 `menu.menu.dashboard` 而不是 `menu.dashboard`）
  4. **语言切换异步问题**: `changeLanguage` 没有等待 i18next 完成就刷新页面
- **修复内容**: 
  1. 在 `apps/web/src/components/Layout.tsx` 中使用 `useMemo` 依赖 `[t, i18n.language]`
  2. 修改 `apps/web/src/i18n/index.ts`，预加载所有翻译资源到 `resources`，移除 HTTP Backend
  3. 修正资源解构逻辑，正确提取嵌套的命名空间内容
  4. 修改 `changeLanguage` 为 async 函数，等待语言切换完成后再刷新页面
- **测试覆盖**: 
  - `apps/web/src/components/Layout.test.tsx` - 菜单国际化单元测试
  - `e2e/tests/i18n.spec.ts` - 国际化 E2E 测试（12个测试用例）
  - `e2e/pages/LanguagePage.ts` - 语言切换页面对象

---

## 测试覆盖汇总

### 前端测试 (Vitest)

| 测试文件 | 测试数量 | 覆盖内容 |
|---------|---------|---------|
| `src/services/api.test.ts` | 5 个 | API 错误处理、响应拦截器 |
| `src/pages/Login.test.tsx` | 12 个 | 登录错误处理、表单验证、API 集成 |
| `src/components/Layout.test.tsx` | 10 个 | 菜单国际化、语言切换 |
| `src/pages/Dashboard.test.tsx` | 15 个 | 仪表盘统计、国际化 |
| `src/pages/Users.test.tsx` | 21 个 | 用户管理 CRUD、表单验证 |
| `src/pages/Roles.test.tsx` | 23 个 | 角色管理、权限选择 |
| `src/pages/Rules.test.tsx` | 29 个 | 规则管理、状态标签 |
| `src/pages/Logs.test.tsx` | 28 个 | 日志查询、Tabs 切换 |
| `src/stores/auth.test.ts` | 23 个 | 登录状态、Token 管理 |

**前端总计**: ✅ 166 个测试通过

### E2E 测试 (Playwright)

| 测试文件 | 测试数量 | 覆盖内容 |
|---------|---------|---------|
| `e2e/tests/login.spec.ts` | 6 个 | 登录功能、表单验证、记住密码 |
| `e2e/tests/dashboard.spec.ts` | 7 个 | 仪表盘、语言切换、响应式布局 |
| `e2e/tests/navigation.spec.ts` | 6 个 | 导航流程、权限控制 |
| `e2e/tests/rules.spec.ts` | 待添加 | 规则管理 |
| `e2e/tests/users.spec.ts` | 待添加 | 用户管理 |
| `e2e/tests/i18n.spec.ts` | 12 个 | 国际化切换、多语言验证 |

**E2E 总计**: ✅ 37+ 个测试通过（7个 i18n 核心测试已稳定通过）

### 后端测试 (Jest)

| 测试文件 | 测试数量 | 覆盖内容 |
|---------|---------|---------|
| `test/unit/auth/auth.service.spec.ts` | 10 个 | 认证服务、用户验证、Token 生成 |
| `test/unit/auth/auth.controller.spec.ts` | 4 个 | 认证控制器 |
| `test/unit/users/users.service.spec.ts` | 8 个 | 用户管理服务 |
| `test/unit/roles/roles.service.spec.ts` | 9 个 | 角色管理服务 |
| `test/unit/rules/rules.service.spec.ts` | 10 个 | 规则管理服务 |
| `test/unit/logs/logs.service.spec.ts` | 6 个 | 日志管理服务 |
| `test/unit/controllers/users.controller.spec.ts` | 16 个 | 用户控制器 |
| `test/unit/controllers/roles.controller.spec.ts` | 13 个 | 角色控制器 |
| `test/unit/controllers/rules.controller.spec.ts` | 14 个 | 规则控制器 |
| `test/unit/controllers/logs.controller.spec.ts` | 9 个 | 日志控制器 |
| `test/unit/guards/jwt-auth.guard.spec.ts` | 12 个 | JWT 认证守卫 |
| `test/unit/guards/local-auth.guard.spec.ts` | 12 个 | 本地认证守卫 |
| `test/unit/interceptors/transform.interceptor.spec.ts` | 12 个 | 响应转换拦截器 |
| `test/unit/filters/http-exception.filter.spec.ts` | 17 个 | 异常过滤器 |

**后端总计**: ✅ 152 个测试通过

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

### 前端测试文件（新增）
1. `apps/web/src/pages/Dashboard.test.tsx` - 仪表盘测试
2. `apps/web/src/pages/Users.test.tsx` - 用户管理测试
3. `apps/web/src/pages/Roles.test.tsx` - 角色管理测试
4. `apps/web/src/pages/Rules.test.tsx` - 规则管理测试
5. `apps/web/src/pages/Logs.test.tsx` - 日志查看测试
6. `apps/web/src/stores/auth.test.ts` - 认证状态管理测试

### 后端测试文件
1. `apps/api/test/unit/auth/auth.service.spec.ts`
2. `apps/api/test/unit/auth/auth.controller.spec.ts`
3. `apps/api/test/unit/users/users.service.spec.ts`
4. `apps/api/test/unit/roles/roles.service.spec.ts`
5. `apps/api/test/unit/rules/rules.service.spec.ts`
6. `apps/api/test/unit/logs/logs.service.spec.ts`
7. `apps/api/test/unit/controllers/users.controller.spec.ts` (新增)
8. `apps/api/test/unit/controllers/roles.controller.spec.ts` (新增)
9. `apps/api/test/unit/controllers/rules.controller.spec.ts` (新增)
10. `apps/api/test/unit/controllers/logs.controller.spec.ts` (新增)
11. `apps/api/test/unit/guards/jwt-auth.guard.spec.ts` (新增)
12. `apps/api/test/unit/guards/local-auth.guard.spec.ts` (新增)
13. `apps/api/test/unit/interceptors/transform.interceptor.spec.ts` (新增)
14. `apps/api/test/unit/filters/http-exception.filter.spec.ts` (新增)
15. `apps/api/test/e2e/auth-error-messages.e2e-spec.ts`
16. `apps/api/test/e2e/i18n-menu.e2e-spec.ts`
17. `apps/api/jest.config.js` - 支持 `.e2e-spec.ts` 文件

### E2E 测试文件（新增）
1. `e2e/pages/LanguagePage.ts` - 语言切换页面对象
2. `e2e/tests/i18n.spec.ts` - 国际化 E2E 测试
3. `e2e/tests/dashboard.spec.ts` - 已更新语言切换测试

---

## 验证步骤

1. **刷新浏览器页面** (F5 或 Cmd+R)
2. 访问 http://localhost:3000
3. 输入错误密码登录
4. 应该看到红色错误提示：**"用户名或密码错误"**
5. 切换语言，左侧菜单应该正确显示对应语言
