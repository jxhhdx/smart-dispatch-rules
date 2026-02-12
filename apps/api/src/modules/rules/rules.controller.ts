import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { RulesService } from './rules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRuleDto, UpdateRuleDto, CreateRuleVersionDto } from './dto/rule.dto';

@Controller('rules')
@UseGuards(JwtAuthGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('status') status: string,
    @Query('keyword') keyword: string,
  ) {
    return this.rulesService.findAll({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      status: status ? parseInt(status, 10) : undefined,
      keyword,
    });
  }

  // 导出规则 - 必须在 :id 路由之前定义
  @Get('export')
  async exportRules(
    @Query('ids') ids: string, 
    @Query('format') format: string = 'json',
    @Query('keyword') keyword?: string,
  ) {
    const ruleIds = ids ? ids.split(',') : [];
    const validFormats = ['json', 'csv', 'xlsx'];
    if (!validFormats.includes(format)) {
      throw new BadRequestException('不支持的导出格式，支持: json, csv, xlsx');
    }
    return this.rulesService.exportRules(ruleIds, format, keyword);
  }

  // 模拟执行 - 必须在 :id 路由之前定义
  @Post('simulate')
  simulate(@Body() data: any) {
    // TODO: 实现规则模拟执行
    return { message: '模拟执行功能待实现', data };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rulesService.findOne(id);
  }

  @Post()
  create(@Body() createRuleDto: CreateRuleDto, @Request() req) {
    return this.rulesService.create(createRuleDto, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateRuleDto: UpdateRuleDto, @Request() req) {
    return this.rulesService.update(id, updateRuleDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rulesService.remove(id);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: number,
    @Request() req,
  ) {
    return this.rulesService.updateStatus(id, status, req.user.userId);
  }

  // 版本管理
  @Get(':id/versions')
  getVersions(@Param('id') id: string) {
    return this.rulesService.getVersions(id);
  }

  @Post(':id/versions')
  createVersion(
    @Param('id') id: string,
    @Body() dto: CreateRuleVersionDto,
    @Request() req,
  ) {
    return this.rulesService.createVersion(id, dto, req.user.userId);
  }

  @Post(':id/versions/:versionId/publish')
  publishVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Request() req,
  ) {
    return this.rulesService.publishVersion(id, versionId, req.user.userId);
  }

  @Post(':id/versions/:versionId/rollback')
  rollbackVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Request() req,
  ) {
    return this.rulesService.rollbackVersion(id, versionId, req.user.userId);
  }

  // 复制规则
  @Post(':id/clone')
  cloneRule(@Param('id') id: string, @Request() req) {
    return this.rulesService.cloneRule(id, req.user.userId);
  }

  // 导出单条规则
  @Get(':id/export')
  async exportSingleRule(@Param('id') id: string, @Query('format') format: string = 'json') {
    const validFormats = ['json', 'csv', 'xlsx'];
    if (!validFormats.includes(format)) {
      throw new BadRequestException('不支持的导出格式，支持: json, csv, xlsx');
    }
    return this.rulesService.exportRules([id], format);
  }
}
