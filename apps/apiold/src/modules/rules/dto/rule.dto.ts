import { IsString, IsOptional, IsInt, IsJSON, IsObject } from 'class-validator';

export class CreateRuleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  ruleType: string;

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsInt()
  @IsOptional()
  priority?: number;
}

export class UpdateRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  priority?: number;

  @IsInt()
  @IsOptional()
  status?: number;

  @IsString()
  @IsOptional()
  businessType?: string;
}

export class CreateRuleVersionDto {
  @IsObject()
  configJson: any;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  conditions?: any[];

  @IsOptional()
  actions?: any[];
}
