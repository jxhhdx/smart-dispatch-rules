import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return role;
  }

  async create(createRoleDto: CreateRoleDto) {
    const { permissionIds, ...roleData } = createRoleDto;

    const role = await this.prisma.role.create({
      data: {
        ...roleData,
        permissions: permissionIds
          ? {
              create: permissionIds.map((id) => ({
                permission: { connect: { id } },
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const { permissionIds, ...roleData } = updateRoleDto;

    // 如果提供了权限列表，先删除旧权限
    if (permissionIds !== undefined) {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        ...roleData,
        permissions: permissionIds
          ? {
              create: permissionIds.map((pid) => ({
                permission: { connect: { id: pid } },
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return role;
  }

  async remove(id: string) {
    // 检查是否有用户在使用该角色
    const roleWithUsers = await this.prisma.role.findUnique({
      where: { id },
      include: { users: true },
    });

    if (roleWithUsers?.users.length) {
      throw new Error('该角色下还有用户，无法删除');
    }

    await this.prisma.role.delete({ where: { id } });
    return { message: '删除成功' };
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      where: { status: 1 },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
