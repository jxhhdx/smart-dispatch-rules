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
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAll(
    @Query('category') category: string,
    @Query('keyword') keyword: string,
  ) {
    return this.templatesService.findAll({ category, keyword });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateTemplateDto, @Request() req) {
    return this.templatesService.create(createDto, req.user.userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTemplateDto,
    @Request() req,
  ) {
    return this.templatesService.update(id, updateDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }
}
