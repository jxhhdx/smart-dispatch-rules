import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  async getStats() {
    const [totalUsers, totalRules, totalRoles, publishedRules] = await Promise.all([
      // 总用户数
      this.prisma.user.count(),
      // 规则总数
      this.prisma.rule.count(),
      // 角色总数
      this.prisma.role.count(),
      // 已发布规则数（status = 1）
      this.prisma.rule.count({
        where: { status: 1 },
      }),
    ]);

    return {
      totalUsers,
      totalRules,
      totalRoles,
      publishedRules,
    };
  }
}
