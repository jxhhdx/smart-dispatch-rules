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

  // 模拟执行
  @Post('simulate')
  simulate(@Body() data: any) {
    // TODO: 实现规则模拟执行
    return { message: '模拟执行功能待实现', data };
  }
}
