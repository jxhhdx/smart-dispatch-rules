import { PrismaClient } from '@prisma/client';

/**
 * 测试数据库工具类
 */
export class PrismaTestUtils {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * 清理所有测试数据
   */
  async cleanDatabase() {
    const tables = [
      'rule_conditions',
      'rule_actions',
      'rule_versions',
      'rules',
      'login_logs',
      'system_logs',
      'role_permissions',
      'permissions',
      'users',
      'roles',
    ];

    for (const table of tables) {
      try {
        await this.prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${table}" CASCADE;`
        );
      } catch (error) {
        console.warn(`Failed to truncate ${table}:`, error.message);
      }
    }
  }

  /**
   * 创建测试用户
   */
  async createTestUser(data: {
    username: string;
    email: string;
    passwordHash: string;
    roleId?: string;
    status?: number;
  }) {
    return this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        status: data.status ?? 1,
      },
    });
  }

  /**
   * 创建测试角色
   */
  async createTestRole(data: {
    name: string;
    code: string;
    description?: string;
  }) {
    return this.prisma.role.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        status: 1,
      },
    });
  }

  /**
   * 创建测试规则
   */
  async createTestRule(data: {
    name: string;
    ruleType: string;
    priority?: number;
    status?: number;
    createdBy?: string;
  }) {
    return this.prisma.rule.create({
      data: {
        name: data.name,
        ruleType: data.ruleType,
        priority: data.priority ?? 0,
        status: data.status ?? 0,
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * 断开数据库连接
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}
