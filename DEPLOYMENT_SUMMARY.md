# 📦 部署摘要（一页纸版）

## 🎯 目标
给客户演示的长期在线系统，完全免费。

---

## 🚀 推荐方案: Render (强烈推荐)

Vercel API 服务存在超时问题，**请使用 Render 部署**。

### 一键部署 (真的只需要 3 步)

```bash
# 1. 登录 Render
https://dashboard.render.com
# 使用 GitHub 账号登录

# 2. 创建 Blueprint
New + → Blueprint → 选择 smart-dispatch-rules → Apply

# 3. 等待 5-10 分钟
# 完成！
```

---

## 📋 准备工作（1 分钟）

| 事项 | 操作 |
|-----|------|
| Render 账号 | 用 GitHub 登录 https://render.com |
| 代码推送 | 确保代码在 GitHub main 分支 |

---

## 🔗 部署后的地址

| 项目 | 地址 |
|-----|------|
| 客户演示地址 | `https://smart-dispatch-web.onrender.com` |
| API 地址 | `https://smart-dispatch-api.onrender.com` |
| 管理员账号 | admin / admin123 |

---

## 💰 费用

**全部免费**
- API 服务: 750 小时/月 (足够)
- 数据库: 1GB (足够)
- 前端: 无限流量

> 💡 API 15 分钟不用会休眠，下次访问 30 秒唤醒

---

## ⚙️ 自动配置的环境变量

Render 会自动配置：
- `DATABASE_URL` (从数据库服务)
- `JWT_SECRET` (自动生成)
- `VITE_API_URL` (从 API 服务)

---

## 🔄 后续更新

推送代码到 main 分支，自动重新部署：
```bash
git push origin main
```

---

## 🆘 遇到问题？

1. 查看详细文档 → `DEPLOYMENT_FINAL.md`
2. 检查 Render Dashboard → Logs
3. 查看 `RENDER_DEPLOYMENT.md` 故障排查章节

---

## 📁 相关文档

| 文档 | 内容 |
|-----|------|
| `DEPLOYMENT_FINAL.md` | 完整部署总结 |
| `RENDER_DEPLOYMENT.md` | Render 详细指南 |
| `DEPLOYMENT_GUIDE.md` | Vercel 指南 (备用) |
| `DEPLOYMENT_STATUS.md` | 状态报告 |

---

## ✅ 部署完成后验证

- [ ] 访问 Web 地址看到登录页
- [ ] admin/admin123 能登录
- [ ] 能创建规则
- [ ] 能查看规则列表

---

**一句话总结**: 登录 Render → New + → Blueprint → 选择仓库 → Apply → 等 10 分钟 → 搞定！
