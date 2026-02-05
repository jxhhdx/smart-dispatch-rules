import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { RulesModule } from './modules/rules/rules.module';
import { LogsModule } from './modules/logs/logs.module';
import { DatabaseModule } from './modules/common/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    RulesModule,
    LogsModule,
  ],
})
export class AppModule {}
