import { Module } from '@nestjs/common';
import { RulesService } from './rules.service';
import { RulesController } from './rules.controller';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';

@Module({
  controllers: [RulesController, TemplatesController],
  providers: [RulesService, TemplatesService],
})
export class RulesModule {}
