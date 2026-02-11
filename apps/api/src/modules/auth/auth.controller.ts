import { Controller, Post, Get, UseGuards, Request, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { LogsService } from '../logs/logs.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private logsService: LogsService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto) {
    const result = await this.authService.login(req.user);
    
    // 记录登录成功日志
    const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    
    await this.logsService.createLoginLog({
      userId: req.user.id,
      username: req.user.username,
      loginType: 'password',
      ipAddress,
      userAgent,
      status: 1,
    });
    
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout() {
    return { message: '退出成功' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh(@Request() req) {
    // JWT 策略返回 userId，login 方法期望 id
    const user = {
      ...req.user,
      id: req.user.userId,
    };
    return this.authService.login(user);
  }
}
