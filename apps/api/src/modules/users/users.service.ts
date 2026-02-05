import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaClient) {}

  async findAll(params: { page?: number; pageSize?: number; keyword?: string }) {
    const { page = 1, pageSize = 20, keyword } = params;
    const skip = (page - 1) * pageSize;

    const where = keyword
      ? {
          OR: [
            { username: { contains: keyword } },
            { realName: { contains: keyword } },
            { email: { contains: keyword } },
          ],
        }
      : {};

    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      list: list.map(({ passwordHash, ...user }) => user),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        passwordHash: hashedPassword,
      },
      include: { role: true },
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: { role: true },
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async remove(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { message: '删除成功' };
  }

  async updateStatus(id: string, status: number) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status },
      include: { role: true },
    });

    const { passwordHash, ...result } = user;
    return result;
  }
}
