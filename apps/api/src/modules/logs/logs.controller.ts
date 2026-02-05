import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('operation')
  findSystemLogs(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('module') module: string,
    @Query('action') action: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.logsService.findSystemLogs({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      module,
      action,
      startDate,
      endDate,
    });
  }

  @Get('login')
  findLoginLogs(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('username') username: string,
    @Query('status') status: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.logsService.findLoginLogs({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      username,
      status: status ? parseInt(status, 10) : undefined,
      startDate,
      endDate,
    });
  }
}
