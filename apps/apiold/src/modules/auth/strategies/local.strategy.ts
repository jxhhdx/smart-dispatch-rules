import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { LogsService } from '../../logs/logs.service';
import { Request } from 'express';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private logsService: LogsService,
  ) {
    super({
      passReqToCallback: true,
    });
  }

  async validate(req: Request, username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      // 记录登录失败日志
      const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || '';
      
      await this.logsService.createLoginLog({
        username,
        loginType: 'password',
        ipAddress,
        userAgent,
        status: 0,
        failReason: '用户名或密码错误',
      });
      
      throw new UnauthorizedException('用户名或密码错误');
    }
    return user;
  }
}
