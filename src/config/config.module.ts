import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { CloudinaryModule } from './cloudinary.module';
import { CloudinaryService } from './services/cloudinary.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    CloudinaryModule,
  ],
  providers: [CloudinaryService],
  exports: [CloudinaryService, NestConfigModule],
})
export class ConfigModule {}
