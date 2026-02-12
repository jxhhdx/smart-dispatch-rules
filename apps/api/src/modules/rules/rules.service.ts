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

  // 复制规则
  async cloneRule(id: string, userId: string) {
    const rule = await this.findOne(id);
    
    // 创建新规则
    const newRule = await this.prisma.rule.create({
      data: {
        name: `${rule.name} - Copy`,
        description: rule.description,
        ruleType: rule.ruleType,
        businessType: rule.businessType,
        priority: rule.priority,
        status: 0, // 草稿状态
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // 复制最新版本
    const latestVersion = rule.versions?.[0];
    if (latestVersion) {
      await this.createVersion(newRule.id, {
        configJson: latestVersion.configJson,
        description: `Copied from "${rule.name}" v${latestVersion.version}`,
        conditions: latestVersion.conditions?.map((c: any) => ({
          conditionType: c.conditionType,
          field: c.field,
          operator: c.operator,
          value: c.value,
          valueType: c.valueType,
          logicType: c.logicType,
        })),
        actions: latestVersion.actions?.map((a: any) => ({
          actionType: a.actionType,
          config: a.configJson,
        })),
      }, userId);
    }

    return this.findOne(newRule.id);
  }

  // 导出规则
  async exportRules(ruleIds: string[], format: string = 'json') {
    let rules: any[];

    if (ruleIds.length === 0) {
      // 导出所有规则
      rules = await this.prisma.rule.findMany({
        include: {
          versions: {
            include: {
              conditions: true,
              actions: true,
            },
            orderBy: { version: 'desc' },
          },
        },
      });
    } else {
      // 导出指定规则
      rules = await Promise.all(
        ruleIds.map(id => this.findOne(id).catch(() => null))
      );
      rules = rules.filter(r => r !== null);
    }

    if (format === 'csv') {
      return this.exportToCsv(rules);
    }

    return {
      exportTime: new Date().toISOString(),
      total: rules.length,
      rules: rules.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        ruleType: r.ruleType,
        businessType: r.businessType,
        priority: r.priority,
        status: r.status,
        versions: r.versions?.map((v: any) => ({
          version: v.version,
          description: v.description,
          status: v.status,
          conditions: v.conditions,
          actions: v.actions,
        })),
      })),
    };
  }

  private exportToCsv(rules: any[]) {
    const headers = ['ID', 'Name', 'Description', 'Rule Type', 'Business Type', 'Priority', 'Status'];
    const rows = rules.map(r => [
      r.id,
      `"${r.name}"`,
      `"${r.description || ''}"`,
      r.ruleType,
      r.businessType || '',
      r.priority,
      r.status === 1 ? 'Published' : r.status === 0 ? 'Draft' : 'Offline',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    return {
      format: 'csv',
      content: csv,
      filename: `rules_export_${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }
}
