import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateRuleDto, UpdateRuleDto, CreateRuleVersionDto } from './dto/rule.dto';
import * as XLSX from 'xlsx';

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

    if (format === 'xlsx') {
      return this.exportToExcel(rules);
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

  // Excel 导出
  private exportToExcel(rules: any[]) {
    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // Rules Sheet
    const rulesData = rules.map(r => ({
      'ID': r.id,
      '名称': r.name,
      '描述': r.description || '',
      '规则类型': r.ruleType,
      '业务类型': r.businessType || '',
      '优先级': r.priority,
      '状态': r.status === 1 ? '已发布' : r.status === 0 ? '草稿' : '已下线',
      '创建时间': r.createdAt,
    }));
    const rulesWs = XLSX.utils.json_to_sheet(rulesData);
    XLSX.utils.book_append_sheet(wb, rulesWs, '规则列表');

    // Versions Sheet
    const versionsData: any[] = [];
    rules.forEach(r => {
      r.versions?.forEach((v: any) => {
        versionsData.push({
          '规则ID': r.id,
          '规则名称': r.name,
          '版本号': v.version,
          '版本描述': v.description || '',
          '版本状态': v.status === 1 ? '已发布' : v.status === 0 ? '草稿' : '已下线',
          '发布时间': v.publishedAt || '',
        });
      });
    });
    if (versionsData.length > 0) {
      const versionsWs = XLSX.utils.json_to_sheet(versionsData);
      XLSX.utils.book_append_sheet(wb, versionsWs, '版本信息');
    }

    // Conditions Sheet
    const conditionsData: any[] = [];
    rules.forEach(r => {
      r.versions?.forEach((v: any) => {
        v.conditions?.forEach((c: any) => {
          conditionsData.push({
            '规则ID': r.id,
            '规则名称': r.name,
            '版本号': v.version,
            '条件字段': c.field || '',
            '操作符': c.operator || '',
            '条件值': c.value || '',
            '逻辑类型': c.logicType || 'AND',
          });
        });
      });
    });
    if (conditionsData.length > 0) {
      const conditionsWs = XLSX.utils.json_to_sheet(conditionsData);
      XLSX.utils.book_append_sheet(wb, conditionsWs, '条件配置');
    }

    // 生成 Buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);

    return {
      format: 'xlsx',
      content: buffer.toString('base64'),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `rules_export_${timestamp}.xlsx`,
    };
  }

  // 导入规则
  async importRules(data: any, userId: string, conflictStrategy: string = 'skip') {
    const { rules } = data;
    
    if (!Array.isArray(rules) || rules.length === 0) {
      throw new BadRequestException('无效的导入数据：规则数组为空');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      imported: [] as any[],
    };

    for (let i = 0; i < rules.length; i++) {
      const ruleData = rules[i];
      
      try {
        // 验证必填字段
        if (!ruleData.name) {
          throw new Error('规则名称为必填项');
        }
        if (!ruleData.ruleType) {
          throw new Error('规则类型为必填项');
        }

        // 检查名称冲突
        const existingRule = await this.prisma.rule.findFirst({
          where: { name: ruleData.name },
        });

        let ruleId: string;

        if (existingRule) {
          switch (conflictStrategy) {
            case 'skip':
              results.errors.push(`第${i + 1}条: 规则"${ruleData.name}"已存在，已跳过`);
              continue;
            case 'overwrite':
              // 更新现有规则
              await this.prisma.rule.update({
                where: { id: existingRule.id },
                data: {
                  description: ruleData.description,
                  ruleType: ruleData.ruleType,
                  businessType: ruleData.businessType,
                  priority: ruleData.priority || 0,
                  updatedBy: userId,
                },
              });
              ruleId = existingRule.id;
              break;
            case 'rename':
              // 生成新名称
              let newName = ruleData.name;
              let counter = 1;
              while (await this.prisma.rule.findFirst({ where: { name: newName } })) {
                newName = `${ruleData.name} (${counter})`;
                counter++;
              }
              ruleData.name = newName;
              const newRule = await this.prisma.rule.create({
                data: {
                  name: ruleData.name,
                  description: ruleData.description,
                  ruleType: ruleData.ruleType,
                  businessType: ruleData.businessType,
                  priority: ruleData.priority || 0,
                  status: 0,
                  createdBy: userId,
                  updatedBy: userId,
                },
              });
              ruleId = newRule.id;
              break;
            default:
              throw new Error('无效的冲突处理策略');
          }
        } else {
          // 创建新规则
          const newRule = await this.prisma.rule.create({
            data: {
              name: ruleData.name,
              description: ruleData.description,
              ruleType: ruleData.ruleType,
              businessType: ruleData.businessType,
              priority: ruleData.priority || 0,
              status: 0,
              createdBy: userId,
              updatedBy: userId,
            },
          });
          ruleId = newRule.id;
        }

        // 导入版本（如果有）
        if (ruleData.versions && Array.isArray(ruleData.versions)) {
          for (const versionData of ruleData.versions) {
            await this.createVersion(ruleId, {
              configJson: versionData.configJson || {},
              description: versionData.description || 'Imported version',
              conditions: versionData.conditions || [],
              actions: versionData.actions || [],
            }, userId);
          }
        }

        results.success++;
        results.imported.push({ id: ruleId, name: ruleData.name });
      } catch (error: any) {
        results.failed++;
        results.errors.push(`第${i + 1}条: ${error.message || '导入失败'}`);
      }
    }

    return results;
  }
}
