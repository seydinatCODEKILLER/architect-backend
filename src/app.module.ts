import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from './config/modules/config.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
