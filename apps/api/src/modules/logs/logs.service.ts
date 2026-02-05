import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaClient) {}

  async findSystemLogs(params: {
    page?: number;
    pageSize?: number;
    module?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, pageSize = 20, module, action, startDate, endDate } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (module) where.module = module;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [list, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          user: { select: { id: true, username: true, realName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findLoginLogs(params: {
    page?: number;
    pageSize?: number;
    username?: string;
    status?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, pageSize = 20, username, status, startDate, endDate } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (username) where.username = { contains: username };
    if (status !== undefined) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [list, total] = await Promise.all([
      this.prisma.loginLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loginLog.count({ where }),
    ]);

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async createSystemLog(data: {
    userId?: string;
    username?: string;
    action: string;
    module: string;
    description?: string;
    params?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.systemLog.create({ data });
  }

  async createLoginLog(data: {
    userId?: string;
    username?: string;
    loginType?: string;
    ipAddress?: string;
    userAgent?: string;
    status?: number;
    failReason?: string;
  }) {
    return this.prisma.loginLog.create({ data });
  }
}
