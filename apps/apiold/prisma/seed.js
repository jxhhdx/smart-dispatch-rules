"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('开始初始化数据库...');
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
//# sourceMappingURL=seed.js.map