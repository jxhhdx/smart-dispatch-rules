import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 创建权限
  const permissions = [
    { name: '系统配置', code: 'system:config', type: 'api' },
    { name: '查看系统日志', code: 'system:log:view', type: 'api' },
    { name: '创建用户', code: 'user:create', type: 'api' },
    { name: '编辑用户', code: 'user:update', type: 'api' },
    { name: '删除用户', code: 'user:delete', type: 'api' },
    { name: '查看用户', code: 'user:view', type: 'api' },
    { name: '创建角色', code: 'role:create', type: 'api' },
    { name: '编辑角色', code: 'role:update', type: 'api' },
    { name: '删除角色', code: 'role:delete', type: 'api' },
    { name: '查看角色', code: 'role:view', type: 'api' },
    { name: '创建规则', code: 'rule:create', type: 'api' },
    { name: '编辑规则', code: 'rule:update', type: 'api' },
    { name: '删除规则', code: 'rule:delete', type: 'api' },
    { name: '查看规则', code: 'rule:view', type: 'api' },
    { name: '发布规则', code: 'rule:publish', type: 'api' },
    { name: '回滚规则', code: 'rule:rollback', type: 'api' },
    { name: '模拟执行规则', code: 'rule:simulate', type: 'api' },
    { name: '执行规则派单', code: 'rule:execute', type: 'api' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
  console.log('权限数据初始化完成');

  // 创建超级管理员角色
  const superAdminRole = await prisma.role.upsert({
    where: { code: 'super_admin' },
    update: {},
    create: {
      name: '超级管理员',
      code: 'super_admin',
      description: '系统所有权限',
    },
  });
  console.log('超级管理员角色创建完成');

  // 给超级管理员角色分配所有权限
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log('超级管理员权限分配完成');

  // 创建默认管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      realName: '管理员',
      roleId: superAdminRole.id,
      status: 1,
    },
  });
  console.log('默认管理员用户创建完成: admin / admin123');

  console.log('数据库初始化完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
