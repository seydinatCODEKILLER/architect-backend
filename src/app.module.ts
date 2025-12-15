import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from './config/modules/config.module';
import { AuthModule } from './auth';

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
