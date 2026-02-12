import { IsString, IsOptional, IsJSON, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNotEmpty()
  conditions: any;
}

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  conditions?: any;
}

export class ImportRulesDto {
  @IsNotEmpty()
  rules: any[];

  @IsString()
  @IsOptional()
  conflictStrategy?: 'skip' | 'overwrite' | 'rename';
}
