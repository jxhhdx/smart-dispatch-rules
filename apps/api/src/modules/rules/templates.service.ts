import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaClient) {}

  async findAll(params: { category?: string; keyword?: string }) {
    const where: any = {};
    
    if (params.category) {
      where.category = params.category;
    }
    
    if (params.keyword) {
      where.OR = [
        { name: { contains: params.keyword } },
        { description: { contains: params.keyword } },
      ];
    }

    const templates = await this.prisma.conditionTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return templates;
  }

  async findOne(id: string) {
    const template = await this.prisma.conditionTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('模板不存在');
    }

    return template;
  }

  async create(createDto: CreateTemplateDto, userId: string) {
    // 检查名称是否已存在
    const existing = await this.prisma.conditionTemplate.findFirst({
      where: { name: createDto.name },
    });

    if (existing) {
      throw new ConflictException('模板名称已存在');
    }

    const template = await this.prisma.conditionTemplate.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        category: createDto.category || 'custom',
        conditions: createDto.conditions,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return template;
  }

  async update(id: string, updateDto: UpdateTemplateDto, userId: string) {
    await this.findOne(id);

    // 如果更新名称，检查唯一性
    if (updateDto.name) {
      const existing = await this.prisma.conditionTemplate.findFirst({
        where: { 
          name: updateDto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('模板名称已存在');
      }
    }

    const template = await this.prisma.conditionTemplate.update({
      where: { id },
      data: {
        ...updateDto,
        updatedBy: userId,
      },
    });

    return template;
  }

  async remove(id: string) {
    await this.findOne(id);
    
    await this.prisma.conditionTemplate.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }
}
