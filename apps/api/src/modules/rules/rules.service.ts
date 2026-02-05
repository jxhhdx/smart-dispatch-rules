import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateRuleDto, UpdateRuleDto, CreateRuleVersionDto } from './dto/rule.dto';

@Injectable()
export class RulesService {
  constructor(private prisma: PrismaClient) {}

  async findAll(params: { page?: number; pageSize?: number; status?: number; keyword?: string }) {
    const { page = 1, pageSize = 20, status, keyword } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status !== undefined) where.status = status;
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.rule.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          creator: { select: { id: true, username: true, realName: true } },
          updater: { select: { id: true, username: true, realName: true } },
          versions: {
            where: { status: 1 },
            take: 1,
            orderBy: { version: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rule.count({ where }),
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

  async findOne(id: string) {
    const rule = await this.prisma.rule.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, username: true, realName: true } },
        updater: { select: { id: true, username: true, realName: true } },
        versions: {
          include: {
            conditions: true,
            actions: true,
          },
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!rule) {
      throw new NotFoundException('规则不存在');
    }

    return rule;
  }

  async create(createRuleDto: CreateRuleDto, userId: string) {
    const rule = await this.prisma.rule.create({
      data: {
        ...createRuleDto,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        creator: { select: { id: true, username: true, realName: true } },
      },
    });

    return rule;
  }

  async update(id: string, updateRuleDto: UpdateRuleDto, userId: string) {
    const rule = await this.prisma.rule.update({
      where: { id },
      data: {
        ...updateRuleDto,
        updatedBy: userId,
      },
      include: {
        creator: { select: { id: true, username: true, realName: true } },
        updater: { select: { id: true, username: true, realName: true } },
      },
    });

    return rule;
  }

  async remove(id: string) {
    await this.prisma.rule.delete({ where: { id } });
    return { message: '删除成功' };
  }

  async updateStatus(id: string, status: number, userId: string) {
    return this.prisma.rule.update({
      where: { id },
      data: { status, updatedBy: userId },
    });
  }

  // 版本管理
  async getVersions(ruleId: string) {
    return this.prisma.ruleVersion.findMany({
      where: { ruleId },
      include: {
        conditions: true,
        actions: true,
      },
      orderBy: { version: 'desc' },
    });
  }

  async createVersion(ruleId: string, dto: CreateRuleVersionDto, userId: string) {
    // 获取当前最大版本号
    const lastVersion = await this.prisma.ruleVersion.findFirst({
      where: { ruleId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (lastVersion?.version || 0) + 1;

    const version = await this.prisma.ruleVersion.create({
      data: {
        ruleId,
        version: newVersion,
        configJson: dto.configJson,
        description: dto.description,
        createdBy: userId,
      },
    });

    // 创建条件和动作
    if (dto.conditions) {
      await this.createConditions(version.id, dto.conditions);
    }

    if (dto.actions) {
      await this.createActions(version.id, dto.actions);
    }

    return this.prisma.ruleVersion.findUnique({
      where: { id: version.id },
      include: { conditions: true, actions: true },
    });
  }

  private async createConditions(versionId: string, conditions: any[], parentId?: string) {
    for (let i = 0; i < conditions.length; i++) {
      const cond = conditions[i];
      const created = await this.prisma.ruleCondition.create({
        data: {
          ruleVersionId: versionId,
          parentId,
          conditionType: cond.conditionType,
          field: cond.field,
          operator: cond.operator,
          value: cond.value,
          valueType: cond.valueType,
          logicType: cond.logicType,
          sortOrder: i,
        },
      });

      if (cond.children && cond.children.length > 0) {
        await this.createConditions(versionId, cond.children, created.id);
      }
    }
  }

  private async createActions(versionId: string, actions: any[]) {
    for (let i = 0; i < actions.length; i++) {
      await this.prisma.ruleAction.create({
        data: {
          ruleVersionId: versionId,
          actionType: actions[i].actionType,
          configJson: actions[i].config,
          sortOrder: i,
        },
      });
    }
  }

  async publishVersion(ruleId: string, versionId: string, userId: string) {
    // 将其他版本设为已下线
    await this.prisma.ruleVersion.updateMany({
      where: { ruleId, status: 1 },
      data: { status: 2 },
    });

    // 发布指定版本
    await this.prisma.ruleVersion.update({
      where: { id: versionId },
      data: {
        status: 1,
        publishedAt: new Date(),
        publishedBy: userId,
      },
    });

    // 更新规则的当前版本
    const version = await this.prisma.ruleVersion.findUnique({
      where: { id: versionId },
    });

    await this.prisma.rule.update({
      where: { id: ruleId },
      data: {
        versionId: versionId,
        status: 1,
        updatedBy: userId,
      },
    });

    return { message: '发布成功' };
  }

  async rollbackVersion(ruleId: string, versionId: string, userId: string) {
    return this.publishVersion(ruleId, versionId, userId);
  }
}
