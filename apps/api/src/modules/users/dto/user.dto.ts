import { IsString, IsEmail, IsOptional, IsInt, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3, { message: '用户名至少3个字符' })
  username: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  @MinLength(6, { message: '密码至少6个字符' })
  password: string;

  @IsString()
  @IsOptional()
  realName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  roleId?: string;
}

export class UpdateUserDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  realName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  roleId?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
